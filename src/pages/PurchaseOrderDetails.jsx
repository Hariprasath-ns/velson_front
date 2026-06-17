import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Search, Trash2, Printer, Eye, X, Pencil, Filter, Settings, FileText, FileSpreadsheet, File as FilePdf } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

const BASE = 'http://localhost:3000'
const today = new Date().toISOString().split('T')[0]
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const STATUS_OPTIONS = [
  { value: '',         label: 'All' },
  { value: 'Pending',  label: 'P.O Pending' },
  { value: 'Approval', label: 'P.O Approved' },
  { value: 'Rejected', label: 'P.O Rejected' },
]

const statusColor = s => ({
  Pending:  'text-amber-600 font-semibold',
  Approval: 'text-green-600 font-semibold',
  Rejected: 'text-red-500 font-semibold',
}[s] ?? 'text-slate-600')

const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] bg-white'
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'
const iconBtn = 'flex items-center gap-1 text-[12px] text-slate-600 hover:text-[#0097A7] transition-colors cursor-pointer select-none'

const fmtDate = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`
}

const Spinner = ({ cls = 'w-4 h-4' }) => (
  <span className={`${cls} border-2 border-current/30 border-t-current rounded-full animate-spin inline-block`} />
)

const ALL_COLS = ['PO No', 'PO Date', 'PO Type', 'Supplier Name', 'Contact Person', 'Status', 'Remarks']

/* ── export helpers ── */
const buildRows = data => data.map(r => ({
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

const doExcelExport = data => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const lines = [cols.join(','), ...rows.map(r => cols.map(c => `"${String(r[c]).replace(/"/g,'""')}"`).join(','))]
  downloadBlob(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'purchase-orders.csv')
}

const doDocExport = data => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const thead = cols.map(c => `<th style="padding:5px 8px;background:#0097A7;color:#fff;font-size:11px;">${c}</th>`).join('')
  const tbody = rows.map((r, i) => `<tr style="${i%2?'background:#f8fafc;':''}">
    ${cols.map(c => `<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;">${r[c]}</td>`).join('')}</tr>`).join('')
  const html = `<html><head><meta charset="utf-8"></head><body>
    <h2>Purchase Order List</h2>
    <table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </body></html>`
  downloadBlob(new Blob([html], { type: 'application/msword' }), 'purchase-orders.doc')
}

const doPrint = data => {
  const rows = buildRows(data)
  const cols = Object.keys(rows[0] || {})
  const thead = cols.map(c => `<th>${c}</th>`).join('')
  const tbody = rows.map((r, i) => `<tr class="${i%2?'alt':''}"><td>${cols.map(c=>r[c]).join('</td><td>')}</td></tr>`).join('')
  const win = window.open('', '_blank', 'width=1100,height=750')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Orders</title>
  <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;margin:16px}
  h2{font-size:15px}table{width:100%;border-collapse:collapse}
  th{background:#0097A7;color:#fff;padding:5px 7px;text-align:left;font-size:10px}
  td{padding:4px 7px;border-bottom:1px solid #e2e8f0;font-size:10px}
  tr.alt td{background:#f8fafc}@media print{@page{margin:1cm}}</style></head>
  <body><h2>Purchase Order List</h2>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </body></html>`)
  win.document.close(); win.focus()
  setTimeout(() => win.print(), 400)
}

export default function PurchaseOrderDetails() {
  const [fromDate, setFromDate]     = useState(thirtyDaysAgo)
  const [toDate, setToDate]         = useState(today)
  const [statusFilter, setStatusFilter] = useState('')
  const [allRows, setAllRows]       = useState([])
  const [rows, setRows]             = useState([])
  const [loading, setLoading]       = useState(true)
  const [searching, setSearching]   = useState(false)
  const [activeRow, setActiveRow]   = useState(null)

  // filter bar
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterText, setFilterText] = useState('')

  // column settings
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hiddenCols, setHiddenCols]     = useState(new Set())
  const settingsRef = useRef(null)

  // view modal
  const [viewPO, setViewPO]   = useState(null)
  const [approving, setApproving] = useState(false)
  const [rejecting, setRejecting] = useState(false)

  // delete
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  useEffect(() => {
    const handler = e => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    fetch(`${BASE}/api/purchase-master`)
      .then(r => r.json())
      .then(json => {
        if (json.success) { setAllRows(json.data); setRows(json.data) }
      })
      .catch(err => console.error('Error fetching POs:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      let result = allRows
      if (statusFilter) result = result.filter(r => r.status === statusFilter)
      result = result.filter(r => {
        const d = r.poDate ? r.poDate.split('T')[0] : ''
        return d >= fromDate && d <= toDate
      })
      setRows(result)
      setActiveRow(null)
      setFilterText('')
      setSearching(false)
    }, 0)
  }

  /* ── column visibility ── */
  const toggleCol = col => setHiddenCols(prev => {
    const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next
  })
  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c))

  /* ── live filter ── */
  const displayRows = filterText.trim()
    ? rows.filter(r => {
        const q = filterText.toLowerCase()
        return (
          (r.poNo || '').toLowerCase().includes(q) ||
          (r.poType || '').toLowerCase().includes(q) ||
          (r.supplier?.supplierName || '').toLowerCase().includes(q) ||
          (r.contactPerson || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
        )
      })
    : rows

  /* ── approve ── */
  const handleApprove = async po => {
    setApproving(true)
    try {
      const res = await fetch(`${BASE}/api/purchase-master/${po.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...po, items: po.details, status: 'Approval', updatedBy: 'Admin' }),
      })
      const json = await res.json()
      if (json.success) {
        const patch = r => r.id === po.id ? { ...r, status: 'Approval' } : r
        setAllRows(prev => prev.map(patch))
        setRows(prev => prev.map(patch))
        setViewPO(v => v ? { ...v, status: 'Approval' } : null)
      } else {
        alert(json.message || 'Approval failed')
      }
    } catch (err) {
      console.error('Approve error:', err)
      alert('Network error')
    } finally {
      setApproving(false)
    }
  }

  /* ── reject ── */
  const handleReject = async po => {
    setRejecting(true)
    try {
      const res = await fetch(`${BASE}/api/purchase-master/${po.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...po, items: po.details, status: 'Rejected', updatedBy: 'Admin' }),
      })
      const json = await res.json()
      if (json.success) {
        const patch = r => r.id === po.id ? { ...r, status: 'Rejected' } : r
        setAllRows(prev => prev.map(patch))
        setRows(prev => prev.map(patch))
        setViewPO(v => v ? { ...v, status: 'Rejected' } : null)
      } else {
        alert(json.message || 'Rejection failed')
      }
    } catch (err) {
      console.error('Reject error:', err)
      alert('Network error')
    } finally {
      setRejecting(false)
    }
  }

  /* ── edit ── */
  const handleEdit = (po, e) => {
    e.stopPropagation()
    localStorage.setItem('velson:po-edit', String(po.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
  }

  /* ── delete ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`${BASE}/api/purchase-master/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success !== false) {
        const filter = r => r.id !== deleteTarget.id
        setAllRows(prev => prev.filter(filter))
        setRows(prev => prev.filter(filter))
        setActiveRow(null)
      }
    } catch (err) {
      console.error('Delete error:', err)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const headerDelete = () => {
    if (activeRow === null || !displayRows[activeRow]) return
    setDeleteTarget(displayRows[activeRow])
  }

  /* ── print ── */
  const handlePrint = () => doPrint(displayRows)

  const headerBg = s => s === 'Approval' ? 'bg-green-600' : s === 'Rejected' ? 'bg-red-500' : 'bg-[#0097A7]'

  const colSpanTotal = visibleCols.length + 4 // View + Edit + Delete + Print

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Purchase</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Purchase Order Details</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">Purchase Order Details</h2>
          <div className="flex gap-2">
            <button
              onClick={headerDelete}
              disabled={activeRow === null}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
            >
              <Printer className="w-3 h-3" /> Print
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }))}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" /> Close
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <label className={lbl}>From Date :</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp} />
            </div>
            <div className="flex items-center gap-1.5">
              <label className={lbl}>To Date :</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inp} />
            </div>
            <div className="flex items-center gap-3">
              {STATUS_OPTIONS.map(opt => (
                <label key={opt.value} className="flex items-center gap-1 text-[12.5px] cursor-pointer whitespace-nowrap">
                  <input type="radio" name="poStatus" value={opt.value} checked={statusFilter === opt.value}
                    onChange={() => setStatusFilter(opt.value)} className="accent-[#0097A7]" />
                  {opt.label}
                </label>
              ))}
            </div>
            <button onClick={handleSearch} disabled={searching || loading}
              className="flex items-center gap-1.5 px-4 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[12px] font-medium transition-colors shadow-sm disabled:opacity-70">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {/* Export + utility */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-500">LS</span>
              <input value={displayRows.length} readOnly className="w-10 text-center border border-slate-300 rounded text-[12px] py-0.5 bg-slate-50" />
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <button onClick={() => doDocExport(displayRows)} className={iconBtn} title="Export as Word">
              <FileText className="w-4 h-4 text-[#0097A7]" /> Dos
            </button>
            <button onClick={() => doExcelExport(displayRows)} className={iconBtn} title="Export as CSV">
              <FileSpreadsheet className="w-4 h-4 text-[#0097A7]" /> Excel
            </button>
            <button onClick={handlePrint} className={iconBtn} title="Print">
              <FilePdf className="w-4 h-4 text-red-500" /> Pdf
            </button>
            <button
              onClick={() => { setFilterOpen(o => !o); if (filterOpen) setFilterText('') }}
              className={`${iconBtn} ${filterOpen ? 'text-[#0097A7]' : ''}`}
            >
              <Filter className={`w-4 h-4 ${filterOpen ? 'text-[#0097A7]' : 'text-blue-500'}`} /> Filter
            </button>
            <div className="relative" ref={settingsRef}>
              <button onClick={() => setSettingsOpen(o => !o)} className={`${iconBtn} ${settingsOpen ? 'text-[#0097A7]' : ''}`}>
                <Settings className="w-4 h-4 text-slate-700" /> Setting
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 min-w-[180px]">
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Show / Hide Columns</p>
                  {ALL_COLS.map(col => (
                    <label key={col} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0097A7]">
                      <input type="checkbox" checked={!hiddenCols.has(col)} onChange={() => toggleCol(col)} className="accent-[#0097A7]" />
                      <span className="text-[12px] text-slate-700">{col}</span>
                    </label>
                  ))}
                  <button onClick={() => setHiddenCols(new Set())} className="mt-2 w-full text-[11px] py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-600 transition-colors">
                    Reset All
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline text filter */}
        {filterOpen && (
          <div className="px-3 py-2 border-b border-slate-200 bg-blue-50/40 flex items-center gap-3 shrink-0">
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <input autoFocus type="text" value={filterText} onChange={e => setFilterText(e.target.value)}
              placeholder="Search PO No, Supplier, Type, Status…"
              className="flex-1 border border-blue-200 rounded px-3 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white" />
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[11px] text-slate-400 shrink-0">{displayRows.length} result{displayRows.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2.5 text-slate-500 text-[12px]">
              <Spinner cls="w-5 h-5 text-[#0097A7]" /> Loading…
            </div>
          ) : (
            <table className="w-full min-w-max text-[12px] text-left border-collapse">
              <thead className="bg-slate-800 text-white sticky top-0 z-10">
                <tr>
                  {visibleCols.map(h => (
                    <th key={h} className="p-2 font-medium border-x border-slate-700 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="p-2 font-medium border-x border-slate-700 text-center">View</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Edit</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Delete</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 text-[12px]">
                      {filterText ? 'No matching records' : 'No purchase orders found'}
                    </td>
                  </tr>
                ) : displayRows.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setActiveRow(i)}
                    className={`cursor-pointer transition-colors ${activeRow === i ? 'bg-[#0097A7]/20' : 'hover:bg-slate-50'}`}
                  >
                    {visibleCols.map(col => {
                      switch (col) {
                        case 'PO No':         return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{row.poNo}</td>
                        case 'PO Date':       return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(row.poDate)}</td>
                        case 'PO Type':       return <td key={col} className="p-1.5 border-x border-slate-200">{row.poType || '—'}</td>
                        case 'Supplier Name': return <td key={col} className="p-1.5 border-x border-slate-200 font-medium">{row.supplier?.supplierName || '—'}</td>
                        case 'Contact Person':return <td key={col} className="p-1.5 border-x border-slate-200">{row.contactPerson || '—'}</td>
                        case 'Status':        return <td key={col} className="p-1.5 border-x border-slate-200"><span className={statusColor(row.status)}>{row.status || '—'}</span></td>
                        case 'Remarks':       return <td key={col} className="p-1.5 border-x border-slate-200 text-slate-500">{row.remarks || '—'}</td>
                        default: return null
                      }
                    })}
                    {/* View */}
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button onClick={e => { e.stopPropagation(); setViewPO(row) }}
                        className="text-[#0097A7] hover:text-[#007a87] transition-colors" title="View details">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {/* Edit */}
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button onClick={e => handleEdit(row, e)}
                        className="text-amber-500 hover:text-amber-600 transition-colors" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {/* Delete */}
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}
                        className="text-red-500 hover:text-red-600 transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    {/* Print */}
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button onClick={e => { e.stopPropagation(); doPrint([row]) }}
                        className="text-purple-500 hover:text-purple-700 transition-colors" title="Print">
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#f4f6ce] font-semibold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={colSpanTotal} className="p-2 border-x border-slate-300">
                    Row : {displayRows.length}{filterText ? ` (filtered from ${rows.length})` : ''}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* ── View Modal ── */}
      {viewPO && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!approving && !rejecting) setViewPO(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-[700px] max-h-[88vh] overflow-hidden flex flex-col">
            {/* Modal header */}
            <div className={`px-5 py-3 flex items-center justify-between shrink-0 ${headerBg(viewPO.status)}`}>
              <div>
                <h3 className="text-white font-semibold text-[14px]">Purchase Order Details</h3>
                <p className="text-white/70 text-[11px] mt-0.5">{viewPO.poNo} &nbsp;·&nbsp; {viewPO.status}</p>
              </div>
              <button onClick={() => setViewPO(null)} disabled={approving || rejecting}
                className="text-white/80 hover:text-white transition-colors disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* PO info grid */}
            <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] shrink-0 border-b border-slate-100">
              {[
                ['PO Number',       viewPO.poNo],
                ['PO Date',         fmtDate(viewPO.poDate)],
                ['ETA Date',        fmtDate(viewPO.etaDate)],
                ['PO Type',         viewPO.poType],
                ['Supplier',        viewPO.supplier?.supplierName],
                ['Contact Person',  viewPO.contactPerson],
                ['Contact No',      viewPO.contactNumber],
                ['GST No',          viewPO.gstNo],
                ['Supplier Ref No', viewPO.supplierRefNo],
                ['Status',          viewPO.status],
                ['Sub Total',       viewPO.subTotal != null ? `₹ ${Number(viewPO.subTotal).toFixed(2)}` : null],
                ['Grand Total',     viewPO.totalAmount != null ? `₹ ${Number(viewPO.totalAmount).toFixed(2)}` : null],
                ['Remarks',         viewPO.remarks],
                ['Created By',      viewPO.createdBy],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-32 font-semibold text-slate-500 shrink-0">{label}</span>
                  <span className="text-slate-400 shrink-0">:</span>
                  <span className={`text-slate-800 ${label === 'Status' ? statusColor(viewPO.status) : ''}`}>
                    {value || '—'}
                  </span>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <p className="text-[12px] font-semibold text-slate-600 mb-2">Items</p>
              {viewPO.details?.length > 0 ? (
                <table className="w-full text-[11.5px] border border-slate-200 rounded">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      {['#','Item Code','Item Name','Description','UOM','Qty','Unit Price','Disc%','Amount','GST%','Net Amt'].map(h => (
                        <th key={h} className="px-2 py-1 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewPO.details.map((it, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-2 py-1">{idx + 1}</td>
                        <td className="px-2 py-1">{it.itemCode || '—'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{it.itemName || '—'}</td>
                        <td className="px-2 py-1">{it.description || '—'}</td>
                        <td className="px-2 py-1">{it.uom || '—'}</td>
                        <td className="px-2 py-1">{it.qty ?? '—'}</td>
                        <td className="px-2 py-1">{it.unitPrice ?? '—'}</td>
                        <td className="px-2 py-1">{it.discPer ?? '—'}</td>
                        <td className="px-2 py-1">{it.amount ?? '—'}</td>
                        <td className="px-2 py-1">{it.gstPer ?? '—'}</td>
                        <td className="px-2 py-1 font-medium">{it.netAmt ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[12px] text-slate-400 italic">No items</p>
              )}
            </div>

            {/* Modal footer with Approve / Reject */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11.5px] text-slate-400">{viewPO.details?.length || 0} item(s)</span>
              <div className="flex gap-2">
                <button onClick={() => setViewPO(null)} disabled={approving || rejecting}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-200 transition-colors disabled:opacity-40">
                  Close
                </button>

                {viewPO.status === 'Pending' && (
                  <>
                    <button onClick={() => handleReject(viewPO)} disabled={approving || rejecting}
                      className="px-5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5">
                      {rejecting
                        ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Rejecting…</>
                        : 'Reject'}
                    </button>
                    <button onClick={() => handleApprove(viewPO)} disabled={approving || rejecting}
                      className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5">
                      {approving
                        ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Approving…</>
                        : 'Approve'}
                    </button>
                  </>
                )}

                {viewPO.status === 'Approval' && (
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 text-[12px] font-semibold rounded-lg border border-green-200">
                    ✓ Approved
                  </span>
                )}
                {viewPO.status === 'Rejected' && (
                  <span className="px-4 py-1.5 bg-red-100 text-red-600 text-[12px] font-semibold rounded-lg border border-red-200">
                    ✗ Rejected
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete purchase order ${deleteTarget?.poNo}? This action cannot be undone.`}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </div>
  )
}
