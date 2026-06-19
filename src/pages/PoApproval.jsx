import React, { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Printer, Eye } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useModulePermission } from '../hooks/useModulePermission'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmtDate = d => {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${months[dt.getMonth()]}-${dt.getFullYear()}`
}

const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white'
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'
const iconBtn = 'flex items-center gap-1 text-[12px] text-slate-600 hover:text-[#0097A7] transition-colors cursor-pointer select-none'

const STATUS_OPTIONS = [
  { value: '',         label: 'All' },
  { value: 'Pending',  label: 'P.O Pending' },
  { value: 'Approval', label: 'P.O Approved' },
  { value: 'Rejected', label: 'P.O Rejected' },
]

const statusColor = s => ({
  Pending:  'text-amber-600 font-medium',
  Approval: 'text-green-600 font-medium',
  Rejected: 'text-red-500 font-medium',
}[s] ?? 'text-slate-600')

const ALL_COLS = ['PO No', 'PO Date', 'PO Type', 'Supplier Name', 'Contact Person', 'Status', 'Remarks']

/* ─── export helpers ──────────────────────────────────────── */
const buildRows = (data) =>
  data.map(r => ({
    'PO No':          r.poNo || '',
    'PO Date':        fmtDate(r.poDate),
    'PO Type':        r.poType || '',
    'Supplier Name':  r.supplier?.supplierName || '',
    'Contact Person': r.contactPerson || '',
    'Status':         r.status || '',
    'Remarks':        r.remarks || '',
  }))

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  document.body.removeChild(a); URL.revokeObjectURL(url)
}

const doExcelExport = (data, from, to) => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const lines = [
    cols.join(','),
    ...rows.map(r => cols.map(c => `"${String(r[c]).replace(/"/g,'""')}"`).join(','))
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `purchase-orders-${from}-${to}.csv`)
}

const doDocExport = (data, from, to) => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const thead = cols.map(c => `<th style="padding:5px 8px;background:#0097A7;color:#fff;text-align:left;font-size:11px;">${c}</th>`).join('')
  const tbody = rows.map((r, i) =>
    `<tr style="${i%2?'background:#f8fafc;':''}">
      ${cols.map(c => `<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;">${r[c]}</td>`).join('')}
    </tr>`
  ).join('')
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head><meta charset='utf-8'><style>body{font-family:Arial;font-size:12px}h2{font-size:15px}p{font-size:11px;color:#555}</style></head>
<body>
<h2>Purchase Order List</h2>
<p>Date Range: ${from} to ${to} &nbsp;&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
<table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<p style="margin-top:8px">Total Records: ${rows.length}</p>
</body></html>`
  const blob = new Blob([html], { type: 'application/msword' })
  downloadBlob(blob, `purchase-orders-${from}-${to}.doc`)
}

const doPrint = (data, from, to) => {
  const rows = buildRows(data)
  const cols = Object.keys(rows[0] || {})
  const thead = cols.map(c => `<th>${c}</th>`).join('')
  const tbody = rows.map((r, i) =>
    `<tr class="${i%2?'alt':''}"><td>${cols.map(c => r[c]).join('</td><td>')}</td></tr>`
  ).join('')
  const win = window.open('', '_blank', 'width=1100,height=750')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Orders</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,sans-serif;font-size:11px;margin:16px;color:#222}
  h2{font-size:15px;margin:0 0 4px}
  .meta{font-size:10px;color:#666;margin-bottom:10px}
  table{width:100%;border-collapse:collapse}
  th{background:#0097A7;color:#fff;padding:5px 7px;text-align:left;font-size:10px;white-space:nowrap}
  td{padding:4px 7px;border-bottom:1px solid #e2e8f0;font-size:10px}
  tr.alt td{background:#f8fafc}
  .footer{margin-top:10px;font-size:10px;color:#777}
  @media print{@page{margin:1cm}button{display:none}}
</style></head><body>
<h2>Purchase Order List</h2>
<p class="meta">Date Range: ${from} to ${to} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; Records: ${rows.length}</p>
<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<p class="footer">Total Rows: ${rows.length}</p>
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

export default function PoApproval() {
  const { canEdit, canPrint } = useModulePermission('po-approval')
  const toast = useToast()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const today = new Date().toISOString().split('T')[0]

  const [fromDate, setFromDate]     = useState(thirtyDaysAgo)
  const [toDate, setToDate]         = useState(today)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedPoId, setSelectedPoId] = useState(null)
  const [allData, setAllData]       = useState([])
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)
  const [searching, setSearching]   = useState(false)

  const [approving, setApproving]   = useState(false)
  const [rejecting, setRejecting]   = useState(false)

  // inline filter
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterText, setFilterText] = useState('')

  // column visibility settings
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hiddenCols, setHiddenCols]     = useState(new Set())
  const settingsRef = useRef(null)

  useEffect(() => {
    const handler = e => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/purchase-master', { skipGlobalLoader: true })
      const list = res.data?.data || []
      setAllData(list)
      // apply initial filters
      let filtered = list
      if (statusFilter) filtered = filtered.filter(r => r.status === statusFilter)
      filtered = filtered.filter(r => {
        const d = r.poDate ? r.poDate.split('T')[0] : ''
        return d >= fromDate && d <= toDate
      })
      setData(filtered)
    } catch (err) {
      console.error('Error fetching POs:', err)
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSearch = () => {
    setSearching(true)
    let result = allData
    if (statusFilter) result = result.filter(r => r.status === statusFilter)
    result = result.filter(r => {
      const d = r.poDate ? r.poDate.split('T')[0] : ''
      return d >= fromDate && d <= toDate
    })
    setData(result)
    setSelectedPoId(null)
    setFilterText('')
    setSearching(false)
  }

  const selectedPo = data.find(po => po.id === selectedPoId)

  /* ── live column filter ── */
  const displayData = filterText.trim()
    ? data.filter(r => {
        const q = filterText.toLowerCase()
        return (
          (r.poNo || '').toLowerCase().includes(q) ||
          (r.poType || '').toLowerCase().includes(q) ||
          (r.supplier?.supplierName || '').toLowerCase().includes(q) ||
          (r.contactPerson || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
        )
      })
    : data

  /* ── column visibility ── */
  const toggleCol = col =>
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(col) ? next.delete(col) : next.add(col)
      return next
    })
  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c))

  /* ── exports ── */
  const handleExcel = () => doExcelExport(displayData, fromDate, toDate)
  const handleDoc   = () => doDocExport(displayData, fromDate, toDate)
  const handlePrint = () => doPrint(displayData, fromDate, toDate)

  /* ── close ── */
  const handleClose = () =>
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }))

  /* ── approve ── */
  const handleApprove = async (po) => {
    setApproving(true)
    try {
      const res = await api.put(`/api/purchase-master/${po.id}`, {
        ...po,
        items: po.details || [],
        status: 'Approval',
        updatedBy: 'Admin'
      })
      const json = res.data
      if (json.success) {
        toast.success(`Purchase Order ${po.poNo} approved.`)
        const patch = r => r.id === po.id ? { ...r, status: 'Approval' } : r
        setAllData(prev => prev.map(patch))
        setData(prev => prev.map(patch))
      } else {
        toast.error(json.message || 'Approval failed')
      }
    } catch (err) {
      console.error('Approve failed:', err)
      toast.error('Approval failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setApproving(false)
    }
  }

  /* ── reject ── */
  const handleReject = async (po) => {
    setRejecting(true)
    try {
      const res = await api.put(`/api/purchase-master/${po.id}`, {
        ...po,
        items: po.details || [],
        status: 'Rejected',
        updatedBy: 'Admin'
      })
      const json = res.data
      if (json.success) {
        toast.warning(`Purchase Order ${po.poNo} rejected.`)
        const patch = r => r.id === po.id ? { ...r, status: 'Rejected' } : r
        setAllData(prev => prev.map(patch))
        setData(prev => prev.map(patch))
      } else {
        toast.error(json.message || 'Rejection failed')
      }
    } catch (err) {
      console.error('Reject failed:', err)
      toast.error('Rejection failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setRejecting(false)
    }
  }

  const renderCell = (row, col) => {
    switch (col) {
      case 'PO No':          return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{row.poNo}</td>
      case 'PO Date':        return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(row.poDate)}</td>
      case 'PO Type':        return <td key={col} className="p-1.5 border-x border-slate-200">{row.poType || '—'}</td>
      case 'Supplier Name':  return <td key={col} className="p-1.5 border-x border-slate-200 font-medium">{row.supplier?.supplierName || '—'}</td>
      case 'Contact Person': return <td key={col} className="p-1.5 border-x border-slate-200">{row.contactPerson || '—'}</td>
      case 'Status':         return <td key={col} className="p-1.5 border-x border-slate-200"><span className={`font-medium ${statusColor(row.status)}`}>{row.status || '—'}</span></td>
      case 'Remarks':        return <td key={col} className="p-1.5 border-x border-slate-200 text-slate-500">{row.remarks || '—'}</td>
      default: return null
    }
  }

  const colSpanTotal = visibleCols.length

  const headerBg = s => s === 'Approval' ? 'bg-green-600' : s === 'Rejected' ? 'bg-red-500' : 'bg-[#0097A7]'

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        <span className="hover:text-[#0097A7] cursor-pointer">Purchase</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">PO Approval</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">Purchase Order Details</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              disabled={!canPrint}
              title={!canPrint ? "No permission to print" : ""}
              className={`px-3 py-1 text-white text-[12px] rounded transition-colors flex items-center gap-1 disabled:opacity-40
                ${!canPrint ? 'bg-slate-500/40 cursor-not-allowed' : 'bg-white/20 hover:bg-white/30'}`}
            >
              <Printer className="w-3 h-3" /> Print List
            </button>
            <button
              onClick={handleClose}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Close
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={lbl}>From Date :</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>To Date :</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
            </div>
            <div className="flex items-center gap-3">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1 text-[12.5px] cursor-pointer whitespace-nowrap text-slate-700">
                  <input type="radio" name="poStatus" value={opt.value} checked={statusFilter === opt.value}
                    onChange={() => setStatusFilter(opt.value)} className="accent-[#0097A7]" />
                  {opt.label}
                </label>
              ))}
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || loading}
              className="flex items-center gap-1.5 px-4 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[12px] font-medium transition-colors shadow-sm disabled:opacity-75"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span> {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Export + utility controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-500">LS</span>
              <input value={displayData.length} readOnly className="w-10 text-center border border-slate-300 rounded text-[12px] py-0.5 bg-slate-50" />
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <button onClick={handleDoc} disabled={!canPrint} className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed`} title={!canPrint ? "No permission to print" : "Export as Word document"}>
              <FileText className="w-4 h-4 text-[#0097A7]" /> Dos
            </button>
            <button onClick={handleExcel} disabled={!canPrint} className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed`} title={!canPrint ? "No permission to print" : "Export as Excel/CSV"}>
              <FileSpreadsheet className="w-4 h-4 text-[#0097A7]" /> Excel
            </button>
            <button onClick={handlePrint} disabled={!canPrint} className={`${iconBtn} disabled:opacity-40 disabled:cursor-not-allowed`} title={!canPrint ? "No permission to print" : "Export as PDF / Print"}>
              <FilePdf className="w-4 h-4 text-red-500" /> Pdf
            </button>
            <button
              onClick={() => { setFilterOpen(o => !o); if (filterOpen) setFilterText('') }}
              className={`${iconBtn} ${filterOpen ? 'text-[#0097A7]' : ''}`}
              title="Toggle search filter"
            >
              <Filter className={`w-4 h-4 ${filterOpen ? 'text-[#0097A7]' : 'text-blue-500'}`} /> Filter
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className={`${iconBtn} ${settingsOpen ? 'text-[#0097A7]' : ''}`}
                title="Column visibility settings"
              >
                <Settings className="w-4 h-4 text-slate-700" /> Setting
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 min-w-[180px]">
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Show / Hide Columns</p>
                  {ALL_COLS.map(col => (
                    <label key={col} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0097A7]">
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col)}
                        onChange={() => toggleCol(col)}
                        className="accent-[#0097A7]"
                      />
                      <span className="text-[12px] text-slate-700">{col}</span>
                    </label>
                  ))}
                  <button
                    onClick={() => setHiddenCols(new Set())}
                    className="mt-2 w-full text-[11px] py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors"
                  >
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline text filter bar */}
        {filterOpen && (
          <div className="px-3 py-2 border-b border-slate-200 bg-blue-50/40 flex items-center gap-3 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input
              autoFocus
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Search across PO No, Supplier, Type, Status…"
              className="flex-1 border border-blue-200 rounded px-3 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white"
            />
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[11px] text-slate-400 shrink-0">{displayData.length} result{displayData.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Data Grid */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2.5 text-slate-500 text-[12px]">
              <span className="w-5 h-5 border-2 border-slate-200 border-t-[#0097A7] rounded-full animate-spin" />
              Loading…
            </div>
          ) : (
            <table className="w-full min-w-max text-[12px] text-left border-collapse">
              <thead className="bg-slate-800 text-white sticky top-0 z-10">
                <tr>
                  {visibleCols.map(h => (
                    <th key={h} className="p-2 font-medium border-x border-slate-700 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 text-[12px]">
                      {filterText ? 'No matching records' : 'No records found'}
                    </td>
                  </tr>
                ) : displayData.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedPoId(row.id)}
                    className={`cursor-pointer transition-colors ${selectedPoId === row.id ? 'bg-[#0097A7]/10 font-semibold' : 'hover:bg-slate-50'}`}
                  >
                    {visibleCols.map(col => renderCell(row, col))}
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#f4f6ce] font-semibold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={colSpanTotal} className="p-2 border-x border-slate-300">
                    Row : {displayData.length}{filterText ? ` (filtered from ${data.length})` : ''}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* Modal Popup Overlay */}
      {selectedPo && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPoId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`${headerBg(selectedPo.status)} px-5 py-3.5 flex items-center justify-between shrink-0`}>
              <h3 className="text-white font-semibold text-[15px]">
                Purchase Order Details - <span className="font-mono">{selectedPo.poNo}</span>
              </h3>
              <button
                onClick={() => setSelectedPoId(null)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-[12.5px]">
              {/* Detail info grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">PO Number</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800 font-mono font-semibold">{selectedPo.poNo}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">PO Date</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{fmtDate(selectedPo.poDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">ETA Date</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{fmtDate(selectedPo.etaDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">PO Type</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.poType || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Status</span>
                    <span className="text-slate-400">:</span>
                    <span className={`font-semibold ${statusColor(selectedPo.status)}`}>{selectedPo.status || '—'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Supplier</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800 font-medium">{selectedPo.supplier?.supplierName || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Contact Person</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.contactPerson || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Contact No</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.contactNumber || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">GST No</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.gstNo || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Supplier Ref No</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.supplierRefNo || '—'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Sub Total</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800 font-medium">{selectedPo.subTotal != null ? `₹ ${Number(selectedPo.subTotal).toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Grand Total</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-900 font-bold">{selectedPo.totalAmount != null ? `₹ ${Number(selectedPo.totalAmount).toFixed(2)}` : '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Created By</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.createdBy || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Remarks</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPo.remarks || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Item table */}
              <div>
                <p className="text-[13px] font-bold text-slate-700 mb-2.5">Requested Items</p>
                {selectedPo.details?.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px] border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          {['#','Item Code','Item Name','Description','UOM','Qty','Unit Price','Disc%','Amount','GST%','Net Amt'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 border-r border-slate-200 last:border-r-0 whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPo.details.map((d, idx) => (
                          <tr key={idx} className={`border-b border-slate-200 last:border-b-0 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-[#0097A7] border-r border-slate-200">{d.itemCode || '—'}</td>
                            <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200">{d.itemName || '—'}</td>
                            <td className="px-3 py-2 text-slate-600 border-r border-slate-200">{d.description || '—'}</td>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{d.uom || '—'}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">{d.qty ?? 0}</td>
                            <td className="px-3 py-2 text-slate-800 border-r border-slate-200">{d.unitPrice ?? 0}</td>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{d.discPer ?? 0}</td>
                            <td className="px-3 py-2 text-slate-800 border-r border-slate-200">{d.amount ?? 0}</td>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{d.gstPer ?? 0}</td>
                            <td className="px-3 py-2 font-bold text-slate-900">{d.netAmt ?? 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic">No items associated with this order.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-200 shrink-0">
              <span className="text-[12px] text-slate-400">{selectedPo.details?.length || 0} item(s)</span>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPoId(null)}
                  disabled={approving || rejecting}
                  className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg transition-colors border border-slate-300 disabled:opacity-50"
                >
                  Close
                </button>
                {selectedPo.status === 'Pending' ? (
                  <>
                    <button
                      onClick={() => handleReject(selectedPo)}
                      disabled={approving || rejecting || !canEdit}
                      title={!canEdit ? "No permission to reject" : ""}
                      className={`px-6 py-2 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 active:scale-95
                        ${!canEdit ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                    >
                      {rejecting ? 'Rejecting…' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleApprove(selectedPo)}
                      disabled={approving || rejecting || !canEdit}
                      title={!canEdit ? "No permission to approve" : ""}
                      className={`px-6 py-2 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 active:scale-95
                        ${!canEdit ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                      {approving ? 'Approving…' : 'Approve'}
                    </button>
                  </>
                ) : selectedPo.status === 'Approval' ? (
                  <span className="px-5 py-2 bg-emerald-100 text-emerald-700 text-[13px] font-semibold rounded-lg border border-emerald-200">
                    ✓ Approved
                  </span>
                ) : (
                  <span className="px-5 py-2 bg-red-100 text-red-600 text-[13px] font-semibold rounded-lg border border-red-200">
                    ✗ Rejected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
