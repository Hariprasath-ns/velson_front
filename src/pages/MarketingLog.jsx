import { useState, useEffect } from 'react'
import { ChevronRight, Upload, Eye, Search, RotateCcw, Save, Trash2, X, FileText, FileUp, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import ConfirmDialog from '../components/ConfirmDialog'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-bold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

// Helper to get local YYYY-MM-DD date string
const getLocalDateString = (date) => {
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export default function MarketingLog() {
  const toast = useToast()
  
  // Date states
  const todayStr = getLocalDateString(new Date())
  const thirtyDaysAgoStr = getLocalDateString(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  
  // Form states
  const [form, setForm] = useState({
    ledgerName: '',
    customerCode: '',
    date: todayStr,
    fileName: '',
    remarks: '',
  })
  
  // Master data
  const [ledgers, setLedgers] = useState([])
  const [masterLoading, setMasterLoading] = useState(true)
  
  // List filter states
  const [filterFromDate, setFilterFromDate] = useState(thirtyDaysAgoStr)
  const [filterToDate, setFilterToDate] = useState(todayStr)
  
  // Records state
  const [records, setRecords] = useState([])
  const [selectedRecordId, setSelectedRecordId] = useState(null)
  
  // UI states
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 1. Fetch ledger data (Customers and Suppliers) on mount
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        setMasterLoading(true)
        const [custRes, suppRes] = await Promise.allSettled([
          api.get('/api/customer-master', { skipGlobalLoader: true }),
          api.get('/api/supplier-master', { skipGlobalLoader: true })
        ])
        
        const ledgerList = []
        
        if (custRes.status === 'fulfilled') {
          const customers = custRes.value.data?.data || []
          customers.forEach(c => {
            ledgerList.push({
              value: c.customerName,
              label: c.customerName,
              code: c.cCode || '',
              type: 'Customer'
            })
          })
        }
        
        if (suppRes.status === 'fulfilled') {
          const suppliers = suppRes.value.data?.data || []
          suppliers.forEach(s => {
            ledgerList.push({
              value: s.supplierName,
              label: s.supplierName,
              code: s.sCode || '',
              type: 'Supplier'
            })
          })
        }
        
        // Sort alphabetically
        ledgerList.sort((a, b) => a.label.localeCompare(b.label))
        setLedgers(ledgerList)
      } catch (err) {
        console.error('Error fetching master data:', err)
        toast.error('Failed to load customers and suppliers list.')
      } finally {
        setMasterLoading(false)
      }
    }
    
    fetchMasterData()
    fetchLogs(thirtyDaysAgoStr, todayStr)
  }, [])

  // Sync Ledger Name selection to Customer Code
  const handleLedgerChange = (e) => {
    const name = e.target.value
    const found = ledgers.find(l => l.value === name)
    setForm(f => ({
      ...f,
      ledgerName: name,
      customerCode: found ? found.code : ''
    }))
  }

  // Sync Customer Code selection to Ledger Name
  const handleCodeChange = (e) => {
    const code = e.target.value
    const found = ledgers.find(l => l.code === code)
    setForm(f => ({
      ...f,
      customerCode: code,
      ledgerName: found ? found.value : ''
    }))
  }

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setForm(f => ({ ...f, fileName: file.name }))
    }
  }

  // Fetch list based on From/To Dates
  const fetchLogs = async (from = filterFromDate, to = filterToDate) => {
    try {
      setIsLoadingList(true)
      const res = await api.get('/api/marketing-log', {
        params: { startDate: from, endDate: to },
        skipGlobalLoader: true
      })
      setRecords(res.data?.data || [])
      setSelectedRecordId(null)
    } catch (err) {
      console.error('Error fetching logs:', err)
      toast.error('Failed to load document logs.')
    } finally {
      setIsLoadingList(false)
    }
  }

  // Save/Upload General Document
  const handleUpload = async () => {
    if (!form.ledgerName || !form.customerCode) {
      toast.warning('Please select a Ledger Name and Customer Code.')
      return
    }
    if (!selectedFile) {
      toast.warning('Please browse and select a file to upload.')
      return
    }
    
    try {
      setIsSaving(true)
      
      // 1. Create text record
      const payload = {
        ledgerName: form.ledgerName,
        customerCode: form.customerCode,
        logDate: form.date,
        remarks: form.remarks,
        createdBy: 'ADMIN'
      }
      
      const logRes = await api.post('/api/marketing-log', payload, {
        loadingMessage: 'Saving document details...'
      })
      
      const newId = logRes.data?.data?.id
      
      // 2. Upload actual file data if ID created
      if (newId && selectedFile) {
        const formData = new FormData()
        formData.append('document', selectedFile)
        await api.post(`/api/marketing-log/${newId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          loadingMessage: 'Uploading file data...'
        })
      }
      
      toast.success('Document uploaded successfully!')
      handleClear()
      fetchLogs()
    } catch (err) {
      console.error('Upload failed:', err)
      toast.error(err.response?.data?.message || 'Failed to save document log.')
    } finally {
      setIsSaving(false)
    }
  }

  // Clear form fields
  const handleClear = () => {
    setForm({
      ledgerName: '',
      customerCode: '',
      date: todayStr,
      fileName: '',
      remarks: '',
    })
    setSelectedFile(null)
  }

  // Delete selected record
  const handleDeleteRow = () => {
    if (!selectedRecordId) {
      toast.warning('Please select a row in the table first.')
      return
    }
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true)
      await api.delete(`/api/marketing-log/${selectedRecordId}`, {
        loadingMessage: 'Deleting document log...'
      })
      toast.success('Record deleted successfully.')
      setShowDeleteConfirm(false)
      fetchLogs()
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error('Failed to delete record.')
    } finally {
      setIsDeleting(false)
    }
  }

  // View/Download file from selected record
  const handleViewFile = () => {
    if (!selectedRecordId) {
      toast.warning('Please select a row in the table first.')
      return
    }
    
    const row = records.find(r => r.id === selectedRecordId)
    if (!row || !row.documentPath) {
      toast.warning('No file uploaded for this record.')
      return
    }
    
    // Open in a new tab/window for inline preview or download
    const url = `/api/marketing-log/${selectedRecordId}/download`
    window.open(url, '_blank')
  }

  // Unique Ledger options
  const ledgerOptions = ledgers.map(l => ({ value: l.value, label: `${l.label} (${l.type})` }))
  // Unique Codes options
  const codeOptions = ledgers.map(l => ({ value: l.code, label: l.code }))

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Quotation</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Marketing Log</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">General Document Upload</h2>
            </div>
            <div>
              <button 
                onClick={() => window.history.back()} 
                className="text-slate-400 hover:text-red-600 transition-colors"
                title="Close"
              >
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Form Fields Grid */}
            <div className="grid grid-cols-12 gap-6 items-start">
              
              {/* Left Column Fields */}
              <div className="col-span-12 md:col-span-6 space-y-4">
                {/* Ledger Name */}
                <div>
                  <Label required>Ledger Name</Label>
                  <Select
                    options={ledgerOptions}
                    value={form.ledgerName}
                    onChange={handleLedgerChange}
                    placeholder={masterLoading ? "Loading ledgers..." : "Select Ledger Name..."}
                    disabled={masterLoading}
                  />
                </div>

                {/* Customer Code */}
                <div>
                  <Label required>Customer Code</Label>
                  <Select
                    options={codeOptions}
                    value={form.customerCode}
                    onChange={handleCodeChange}
                    placeholder={masterLoading ? "Loading codes..." : "Select Customer Code..."}
                    disabled={masterLoading}
                  />
                </div>

                {/* Date */}
                <div>
                  <Label required>Date</Label>
                  <Input 
                    type="date" 
                    value={form.date} 
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))} 
                  />
                </div>

                {/* Remarks Section */}
                <div>
                  <Label>Remarks</Label>
                  <textarea
                    value={form.remarks}
                    onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))}
                    placeholder="Enter remarks or notes..."
                    className="w-full min-h-[120px] mt-1 px-3 py-2 text-sm border border-slate-200 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-200 resize-none hover:border-slate-300"
                  />
                </div>
              </div>

              {/* Right Column - File Upload Section */}
              <div className="col-span-12 md:col-span-6 space-y-2">
                <Label required>Upload Document Name</Label>
                {selectedFile ? (
                  <div className="flex flex-col items-center justify-center gap-3 px-4 py-6 border-2 border-[#0097A7] rounded-lg bg-[#D4F1F4]/10 min-h-[180px] md:min-h-[298px] relative">
                    <div className="w-12 h-12 bg-[#D4F1F4] rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-[#0097A7]" />
                    </div>
                    <div className="text-center min-w-0 px-2">
                      <p className="text-xs font-semibold text-[#0097A7] truncate max-w-[240px]" title={form.fileName}>{form.fileName}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setForm(f => ({ ...f, fileName: '' }));
                      }}
                      className="absolute top-3 right-3 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shadow transition-colors"
                      title="Remove File"
                    >✕</button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-3 px-4 py-6 border-2 border-dashed border-slate-200 rounded-lg cursor-pointer hover:border-[#0097A7] hover:bg-[#D4F1F4]/30 transition-all group min-h-[180px] md:min-h-[298px]">
                    <div className="w-12 h-12 bg-[#D4F1F4] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-[#0097A7]/20 transition-colors">
                      <Upload className="w-6 h-6 text-[#0097A7]" />
                    </div>
                    <div className="text-center">
                      <p className="text-xs font-semibold text-slate-600">Upload Document</p>
                      <p className="text-[11px] text-slate-400 mt-1">Click to browse and upload any file</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleFileChange} 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Date Filters & Controls */}
            <div className="mt-8 border-t border-slate-200 pt-6 flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-600 uppercase">From Date:</span>
                  <Input 
                    type="date" 
                    value={filterFromDate} 
                    onChange={e => setFilterFromDate(e.target.value)} 
                    className="w-[140px] py-[4px] text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-slate-600 uppercase">To Date:</span>
                  <Input 
                    type="date" 
                    value={filterToDate} 
                    onChange={e => setFilterToDate(e.target.value)} 
                    className="w-[140px] py-[4px] text-xs"
                  />
                </div>
                <button
                  onClick={() => fetchLogs()}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-colors active:scale-95"
                >
                  <Search size={14} /> Show
                </button>
              </div>

              <div className="flex items-center gap-2">
                    <button 
                      onClick={handleUpload}
                      disabled={isSaving}
                      className="flex items-center justify-center gap-1.5 px-4 py-[7px] bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-sm transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap"
                    >
                      {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      Save
                    </button>
                <button
                  onClick={handleViewFile}
                  disabled={!selectedRecordId}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-[12px] font-bold rounded shadow-sm transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye size={14} /> View File
                </button>
                <button
                  onClick={handleDeleteRow}
                  disabled={!selectedRecordId}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded shadow-sm transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} /> Delete Row
                </button>
                <button
                  onClick={handleClear}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold rounded shadow-sm transition-colors active:scale-95"
                >
                  <RotateCcw size={14} /> Clear
                </button>
              </div>
            </div>

            {/* Document logs list table */}
            <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3.5 border-r border-slate-200 w-14 text-center">S.No</th>
                      <th className="px-4 py-3.5 border-r border-slate-200">Ledger Name</th>
                      <th className="px-4 py-3.5 border-r border-slate-200">Customer Code</th>
                      <th className="px-4 py-3.5 border-r border-slate-200 w-28 text-center">Date</th>
                      <th className="px-4 py-3.5 border-r border-slate-200">File Name</th>
                      <th className="px-4 py-3.5">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoadingList ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#0097A7] mb-2" />
                          Loading logs...
                        </td>
                      </tr>
                    ) : records.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-16 text-center text-slate-300 italic text-sm">
                          <FileText size={40} className="mx-auto mb-2 opacity-20" />
                          No uploaded documents found for the selected date range.
                        </td>
                      </tr>
                    ) : (
                      records.map((row, idx) => {
                        const isSelected = selectedRecordId === row.id
                        return (
                          <tr
                            key={row.id}
                            onClick={() => setSelectedRecordId(isSelected ? null : row.id)}
                            className={`hover:bg-slate-50 transition-colors cursor-pointer h-12 ${isSelected ? 'bg-sky-50/70 border-l-[3px] border-l-[#0097A7] pl-[13px]' : ''}`}
                          >
                            <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-400 font-bold text-[12px]">{idx + 1}</td>
                            <td className="px-4 py-2 border-r border-slate-200 font-semibold text-slate-800 text-[12px]">{row.ledgerName}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-[#0097A7] font-bold text-[12px]">{row.customerCode}</td>
                            <td className="px-4 py-2 border-r border-slate-200 text-center text-slate-500 text-[12px]">
                              {new Date(row.logDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-4 py-2 border-r border-slate-200 text-[12px]">
                              {row.documentPath ? (
                                <span className="inline-flex items-center gap-1.5 text-[#0097A7] font-semibold">
                                  <FileText size={13} /> {row.documentPath}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">No File</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-slate-600 text-[12px] truncate max-w-[200px]" title={row.remarks}>
                              {row.remarks || '—'}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete Document Log"
        message="Are you sure you want to delete this document upload log? This action cannot be undone."
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        confirming={isDeleting}
      />
    </div>
  )
}
