import { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Trash2, Pencil, Search, Plus, Eye, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import api from '../services/api'
import { SpinnerLoader } from '../components/LocalLoader'



const inp = 'border border-slate-300 rounded px-2 py-1 text-[11.5px] focus:outline-none focus:border-[#0097A7] bg-white h-7 w-full'
const lbl = 'text-[11px] font-bold text-slate-600 whitespace-nowrap'
const iconBtn = 'flex items-center gap-1.5 text-[11px] font-bold text-slate-600 hover:text-[#0097A7] transition-colors cursor-pointer'

export default function CCMSEntryDetails() {
  const toast = useToast()
  
  const getTodayDateStr = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getOneYearAgoDateStr = () => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split('T')[0];
  };

  const [fromDate, setFromDate] = useState(getOneYearAgoDateStr())
  const [toDate, setToDate] = useState(getTodayDateStr())
  
  const [customerName, setCustomerName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [serviceType, setServiceType] = useState('')
  const [modelNo, setModelNo] = useState('')
  const [statusFilter, setStatusFilter] = useState('Open')
  
  const [allRows, setAllRows] = useState([])
  const [filteredRows, setFilteredRows] = useState([])
  const [activeRowId, setActiveRowId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)

  // Fetch / Load complaints
  const loadComplaints = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/customer-complaint')
      if (res.data?.success && res.data.data) {
        setAllRows(res.data.data)
        // Default to filtering by status 'Open' initially
        const openComplaints = res.data.data.filter(r => (r.status || 'Open') === 'Open')
        setFilteredRows(openComplaints)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load customer complaints.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadComplaints()
  }, [])

  // Options for filtering derived from actual data
  const customerNames = [...new Set(allRows.map(r => r.customerName).filter(Boolean))]
  const customerCodes = [...new Set(allRows.map(r => r.customerCode).filter(Boolean))]
  const serviceTypes = [...new Set(allRows.map(r => r.serviceType).filter(Boolean))]
  const modelNos = [...new Set(allRows.map(r => r.modelNo).filter(Boolean))]

  const handleSearch = () => {
    let result = allRows

    // Filter by Date range (recDate conversion or raw matching)
    if (fromDate || toDate) {
      result = result.filter(r => {
        if (!r.recDate) return true
        // format is DD/MM/YYYY or DD-MMM-YYYY. Let's parse both
        let dateVal
        if (r.recDate.includes('/')) {
          const [d, m, y] = r.recDate.split('/')
          dateVal = new Date(`${y}-${m}-${d}`)
        } else {
          dateVal = new Date(r.recDate)
        }
        
        if (isNaN(dateVal.getTime())) return true
        
        const fDate = fromDate ? new Date(fromDate) : null
        const tDate = toDate ? new Date(toDate) : null
        
        if (fDate && dateVal < fDate) return false
        if (tDate && dateVal > tDate) return false
        return true
      })
    }

    if (customerName) {
      result = result.filter(r => r.customerName === customerName)
    }
    if (customerCode) {
      result = result.filter(r => r.customerCode === customerCode)
    }
    if (serviceType) {
      result = result.filter(r => r.serviceType === serviceType)
    }
    if (modelNo) {
      result = result.filter(r => r.modelNo === modelNo)
    }
    if (statusFilter) {
      result = result.filter(r => (r.status || 'Open') === statusFilter)
    }

    setFilteredRows(result)
    setActiveRowId(null)
  }

  const handleEdit = () => {
    if (!activeRowId) return
    localStorage.setItem('velson:complaint-edit', activeRowId)
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'CustomerComplaintEntry' } }))
  }

  const handleDeleteClick = () => {
    if (!activeRowId) return
    const target = allRows.find(r => String(r.id) === String(activeRowId))
    if (target) setDeleteTarget(target)
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      const res = await api.delete(`/api/customer-complaint/${activeRowId}`)
      if (res.data?.success) {
        setAllRows(prev => prev.filter(r => String(r.id) !== String(activeRowId)))
        setFilteredRows(prev => prev.filter(r => String(r.id) !== String(activeRowId)))
        setActiveRowId(null)
        setDeleteTarget(null)
        toast.success("Complaint deleted successfully.")
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to delete complaint.')
    } finally {
      setDeleting(false)
    }
  }


  // Export functions
  const buildExportRows = data => data.map(r => ({
    'S.No': r.id,
    'CCMC No': r.ccNo || '',
    'Customer Name': r.customerName || '',
    'Customer Code': r.customerCode || '',
    'Complainant Name': r.complainantName || '',
    'Mobile No': r.mobileNo || '',
    'Complaint Type': r.complaintType || '',
    'Complaint Date': r.recDate || '',
    'Service Type': r.serviceType || '',
    'Model Name': r.modelNo || '',
    'Complaint Status': r.status || '',
    'Approval Status': r.approvalStatus || ''
  }))

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  const doExcelExport = () => {
    const rows = buildExportRows(filteredRows)
    if (!rows.length) return
    const cols = Object.keys(rows[0])
    const lines = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c]).replace(/"/g,'""')}"`).join(','))]
    downloadBlob(new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'ccms-details.csv')
  }

  const doDocExport = () => {
    const rows = buildExportRows(filteredRows)
    if (!rows.length) return
    const cols = Object.keys(rows[0])
    const thead = cols.map(c => `<th style="padding:5px 8px;background:#0097A7;color:#fff;font-size:11px;">${c}</th>`).join('')
    const tbody = rows.map((r, i) => `<tr style="${i%2?'background:#f8fafc;':''}">
      ${cols.map(c => `<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;">${r[c]}</td>`).join('')}</tr>`).join('')
    const html = `<html><head><meta charset="utf-8"></head><body>
      <h2>CCMS Entry Details</h2>
      <table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
    </body></html>`
    downloadBlob(new Blob([html], { type: 'application/msword' }), 'ccms-details.doc')
  }

  const doPrint = () => {
    const rows = buildExportRows(filteredRows)
    const cols = Object.keys(rows[0] || {})
    const thead = cols.map(c => `<th>${c}</th>`).join('')
    const tbody = rows.map((r, i) => `<tr class="${i%2?'alt':''}"><td>${cols.map(c=>r[c]).join('</td><td>')}</td></tr>`).join('')
    const win = window.open('', '_blank', 'width=1100,height=750')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>CCMS Entry Details</title>
    <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;margin:16px}
    h2{font-size:15px}table{width:100%;border-collapse:collapse}
    th{background:#0097A7;color:#fff;padding:5px 7px;text-align:left;font-size:10px}
    td{padding:4px 7px;border-bottom:1px solid #e2e8f0;font-size:10px}
    tr.alt td{background:#f8fafc}@media print{@page{margin:1cm}}</style></head>
    <body><h2>CCMS Entry Details</h2>
    <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
    </body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => win.print(), 400)
  }

  const displayRows = filterText.trim()
    ? filteredRows.filter(r => {
        const q = filterText.toLowerCase()
        return (
          (r.customerName || '').toLowerCase().includes(q) ||
          (r.customerCode || '').toLowerCase().includes(q) ||
          (r.ccNo || '').toLowerCase().includes(q) ||
          (r.complainantName || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
        )
      })
    : filteredRows

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col bg-[#e0f7fa] relative">
      {/* Centralized Fullscreen Loader Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <SpinnerLoader size={30} message="Loading Data..." />
        </div>
      )}
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        <span className="hover:text-[#0097A7] cursor-pointer">CCMS</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">CCMS Entry Details</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header Block */}
        <div className="px-4 py-2 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-700 rounded-sm" />
            <h1 className="text-[12px] font-bold text-slate-700">CCMS Entry Details</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleEdit}
              disabled={!activeRowId}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors"
            >
              <Pencil className="w-3 h-3 text-emerald-600" /> Edit
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={!activeRowId}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 disabled:opacity-40 border border-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3 text-red-500" /> Delete
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }))}
              className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-[11px] font-bold text-slate-700 flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3 text-slate-500" /> Close
            </button>
          </div>
        </div>

        {/* Filters and Search Fields */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 shrink-0 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Dates row */}
            <div className="md:col-span-3 flex items-center gap-2">
              <label className={lbl}>From Date :</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp}/>
            </div>
            
            <div className="md:col-span-3 flex items-center gap-2">
              <label className={lbl}>To Date :</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inp}/>
            </div>
            
            <div className="md:col-span-6 flex gap-2 justify-start md:justify-end">
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-3 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[11.5px] font-bold transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-orange-500"></span> Search
              </button>
              
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-3 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[11.5px] font-bold transition-colors shadow-sm"
              >
                <span className="w-2 h-2 rounded-full bg-[#f57c00]"></span> Details
              </button>

              <button
                onClick={doPrint}
                className="flex items-center gap-1.5 px-3 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[11.5px] font-bold transition-colors shadow-sm"
              >
                <FilePdf className="w-3.5 h-3.5 text-red-500" /> View PDF
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-3 pb-3">
            <div className="space-y-1">
              <label className={lbl}>Customer Name :</label>
              <select value={customerName} onChange={e => setCustomerName(e.target.value)} className={inp}>
                <option value="">-- Select Customer --</option>
                {customerNames.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={lbl}>Customer Code :</label>
              <select value={customerCode} onChange={e => setCustomerCode(e.target.value)} className={inp}>
                <option value="">-- Select Code --</option>
                {customerCodes.map(code => <option key={code} value={code}>{code}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={lbl}>Service Type :</label>
              <select value={serviceType} onChange={e => setServiceType(e.target.value)} className={inp}>
                <option value="">-- Select Service Type --</option>
                {serviceTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={lbl}>Model No :</label>
              <select value={modelNo} onChange={e => setModelNo(e.target.value)} className={inp}>
                <option value="">-- Select Model No --</option>
                {modelNos.map(model => <option key={model} value={model}>{model}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className={lbl}>Complaint Status :</label>
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inp}>
                <option value="">-- All --</option>
                <option value="Open">Open</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setFilteredRows(allRows.filter(r => (r.status || 'Open') === 'Open')); setActiveRowId(null); setFilterText(''); setCustomerName(''); setCustomerCode(''); setServiceType(''); setModelNo(''); setStatusFilter('Open') }}
                className="text-[11px] font-bold text-slate-500 hover:text-[#0097A7] transition-colors"
              >
                Clear Filters
              </button>
              <div className="h-4 w-px bg-slate-200" />
              <button
                onClick={() => {
                  localStorage.removeItem('velson:complaint-edit')
                  window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'CustomerComplaintEntry' } }))
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-[#0097A7] hover:text-[#007a87]"
              >
                <Plus className="w-3.5 h-3.5" /> Add New Complaint
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500">LS</span>
                <input value={displayRows.length} readOnly className="w-10 text-center border border-slate-300 rounded text-[11px] py-0.5 bg-slate-50 font-bold"/>
              </div>
              <div className="h-4 w-px bg-slate-300"/>
              <button onClick={doDocExport} className={iconBtn}><FileText className="w-4 h-4 text-[#0097A7]"/> Dos</button>
              <button onClick={doExcelExport} className={iconBtn}><FileSpreadsheet className="w-4 h-4 text-[#0097A7]"/> Excel</button>
              <button onClick={doPrint} className={iconBtn}><FilePdf className="w-4 h-4 text-red-500"/> Pdf</button>
              <button
                onClick={() => { setFilterOpen(o => !o); if (filterOpen) setFilterText('') }}
                className={`${iconBtn} ${filterOpen ? 'text-[#0097A7]' : ''}`}
              >
                <Filter className="w-4 h-4 text-blue-500"/> Filter
              </button>
            </div>
          </div>
        </div>

        {/* Text Filter input */}
        {filterOpen && (
          <div className="px-3 py-2 border-b border-slate-200 bg-blue-50/40 flex items-center gap-3 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0"/>
            <input autoFocus type="text" value={filterText} onChange={e => setFilterText(e.target.value)}
              placeholder="Search CC No, Customer Name, Complainant, Status..."
              className="flex-1 border border-blue-200 rounded px-3 py-1 text-[11.5px] focus:outline-none focus:border-[#0097A7] bg-white"/>
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
            <span className="text-[11px] text-slate-400 shrink-0">{displayRows.length} results</span>
          </div>
        )}

        {/* Data Grid / Table */}
        <div className="flex-1 overflow-auto relative">
          <table className="w-full min-w-max text-[11.5px] text-left border-collapse">
            <thead className="bg-slate-800 text-white sticky top-0 z-10">
              <tr>
                <th className="p-2 font-medium border-x border-slate-700 text-center w-10">S.No</th>
                {/* <th className="p-2 font-medium border-x border-slate-700 text-center w-10">ID</th> */}
                <th className="p-2 font-medium border-x border-slate-700">CCMC No</th>
                <th className="p-2 font-medium border-x border-slate-700">Customer Name</th>
                <th className="p-2 font-medium border-x border-slate-700">Customer Code</th>
                <th className="p-2 font-medium border-x border-slate-700">Complainted Name</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Mobile No</th>
                <th className="p-2 font-medium border-x border-slate-700">Complaint Type</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Complaint Date</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Service Type</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Model Name</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Complaint Status</th>
                <th className="p-2 font-medium border-x border-slate-700 text-center">Approval Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {displayRows.length === 0 ? (
                <tr>
                  <td colSpan={13} className="p-8 text-center text-slate-400 text-[12px]">
                    No matching records found.
                  </td>
                </tr>
              ) : displayRows.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => setActiveRowId(row.id)}
                  className={`cursor-pointer transition-colors ${String(activeRowId) === String(row.id) ? 'bg-[#0097A7]/20 font-semibold text-slate-900' : (i % 2 === 1 ? 'bg-slate-50/40 text-rose-600' : 'bg-white text-slate-700')}`}
                >
                  <td className="p-1.5 border-x border-slate-200 text-center">{i + 1}</td>
                  {/* <td className="p-1.5 border-x border-slate-200 text-center">{row.id}</td> */}
                  <td className="p-1.5 border-x border-slate-200 text-[#0097A7] font-semibold">{row.ccNo}</td>
                  <td className="p-1.5 border-x border-slate-200 uppercase whitespace-nowrap">{row.customerName || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200">{row.customerCode || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 uppercase">{row.complainantName || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 text-center">{row.mobileNo || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200">{row.complaintType || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 text-center">{row.recDate || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 text-center">{row.serviceType || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 text-center">{row.modelNo || '—'}</td>
                  <td className="p-1.5 border-x border-slate-200 text-center font-bold">
                    <span className={row.status === 'Closed' ? 'text-emerald-600' : 'text-rose-600'}>
                      {row.status || 'Open'}
                    </span>
                  </td>
                  <td className="p-1.5 border-x border-slate-200 text-center">
                    <span className="text-emerald-600 font-bold">{row.approvalStatus || '—'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete customer complaint with CC No: ${deleteTarget?.ccNo}? This action cannot be undone.`}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </div>
  )
}