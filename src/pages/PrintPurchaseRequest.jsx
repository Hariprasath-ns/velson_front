import { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Trash2, Printer, Eye, Pencil } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const fmtDate = d => {
  if (!d) return ''
  const dt = new Date(d)
  return `${String(dt.getDate()).padStart(2,'0')}-${months[dt.getMonth()]}-${dt.getFullYear()}`
}

const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white'
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'
const iconBtn = 'flex items-center gap-1 text-[12px] text-slate-600 hover:text-[#0097A7] transition-colors cursor-pointer select-none'

const applyFilter = (records, from, to) => {
  const f = from ? new Date(from) : null
  const t = to   ? new Date(to + 'T23:59:59') : null
  return records.filter(pr => {
    const d = new Date(pr.prDate)
    if (f && d < f) return false
    if (t && d > t) return false
    return true
  })
}

const ALL_COLS = [
  'Request No', 'Request Date', 'Department Name', 'Job No',
  'Request User', 'Required Date', 'Approval', 'PO No', 'PO Date',
]

/* ─── export helpers ──────────────────────────────────────── */
const buildRows = (data) =>
  data.map(pr => ({
    'Request No':    pr.prNo || '',
    'Request Date':  fmtDate(pr.prDate),
    'Department':    pr.department || '',
    'Job No':        pr.details?.map(d => d.jobNo).filter(Boolean).join('; ') || '',
    'Request User':  pr.requestingUser || '',
    'Required Date': fmtDate(pr.requiredDate),
    'Approval':      pr.status || '',
    'PO No':         pr.poNo || '',
    'PO Date':       pr.poDate ? fmtDate(pr.poDate) : '',
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
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `purchase-requests-${from}-${to}.csv`)
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
<h2>Purchase Request List</h2>
<p>Date Range: ${from} to ${to} &nbsp;&nbsp; Generated: ${new Date().toLocaleDateString()}</p>
<table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<p style="margin-top:8px">Total Records: ${rows.length}</p>
</body></html>`
  const blob = new Blob([html], { type: 'application/msword' })
  downloadBlob(blob, `purchase-requests-${from}-${to}.doc`)
}

const doPrint = (data, from, to) => {
  const rows = buildRows(data)
  const cols = Object.keys(rows[0] || {})
  const thead = cols.map(c => `<th>${c}</th>`).join('')
  const tbody = rows.map((r, i) =>
    `<tr class="${i%2?'alt':''}"><td>${cols.map(c => r[c]).join('</td><td>')}</td></tr>`
  ).join('')
  const win = window.open('', '_blank', 'width=1100,height=750')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Purchase Requests</title>
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
<h2>Purchase Request List</h2>
<p class="meta">Date Range: ${from} to ${to} &nbsp;|&nbsp; Printed: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; Records: ${rows.length}</p>
<table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<p class="footer">Total Rows: ${rows.length}</p>
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

/* ─── component ───────────────────────────────────────────── */
export default function PrintPurchaseRequest() {
  const [fromDate, setFromDate]     = useState('2026-04-01')
  const [toDate, setToDate]         = useState(new Date().toISOString().split('T')[0])
  const [activeRow, setActiveRow]   = useState(null)
  const [allData, setAllData]       = useState([])
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)

  // modals / dialogs
  const [viewPR, setViewPR]         = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]     = useState(false)
  const [approving, setApproving]   = useState(false)
  const [rejecting, setRejecting]   = useState(false)

  // inline filter (Filter button)
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterText, setFilterText] = useState('')

  // column visibility (Settings button)
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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const res  = await fetch('http://localhost:3000/api/purchase-request')
        const json = await res.json()
        if (json.success && json.data) {
          setAllData(json.data)
          setData(applyFilter(json.data, fromDate, toDate))
        }
      } catch (err) {
        console.error('Error fetching purchase requests:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  /* ── date search ── */
  const handleSearch = () => {
    setData(applyFilter(allData, fromDate, toDate))
    setActiveRow(null)
    setFilterText('')
  }

  /* ── live column filter ── */
  const displayData = filterText.trim()
    ? data.filter(pr => {
        const q = filterText.toLowerCase()
        const jobNo = pr.details?.map(d => d.jobNo).filter(Boolean).join(' ') || ''
        return (
          (pr.prNo || '').toLowerCase().includes(q) ||
          (pr.department || '').toLowerCase().includes(q) ||
          (pr.requestingUser || '').toLowerCase().includes(q) ||
          (pr.status || '').toLowerCase().includes(q) ||
          (pr.poNo || '').toLowerCase().includes(q) ||
          jobNo.toLowerCase().includes(q)
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

  /* ── header-level delete (deletes active row) ── */
  const handleHeaderDelete = () => {
    if (activeRow === null || !displayData[activeRow]) return
    setDeleteTarget(displayData[activeRow])
  }

  /* ── row delete confirm ── */
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`http://localhost:3000/api/purchase-request/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok && json.success !== false) {
        const updated = allData.filter(r => r.id !== deleteTarget.id)
        setAllData(updated)
        setData(applyFilter(updated, fromDate, toDate))
        setActiveRow(null)
      }
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  /* ── edit ── */
  const handleEdit = (pr, e) => {
    e.stopPropagation()
    localStorage.setItem('velson:pr-edit', String(pr.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseRequestEntry' } }))
  }

  /* ── approve ── */
  const handleApprove = async (pr) => {
    setApproving(true)
    try {
      // If PR already has a PO number, navigate to edit that existing PO
      if (pr.poNo) {
        const poListRes  = await fetch('http://localhost:3000/api/purchase-master')
        const poListJson = await poListRes.json()
        if (poListJson.success) {
          const existingPO = poListJson.data.find(p => p.poNo === pr.poNo)
          if (existingPO) {
            setViewPR(null)
            localStorage.setItem('velson:po-edit', String(existingPO.id))
            window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
            return
          }
        }
      }

      // First-time approval: generate a new PO number
      const nextRes  = await fetch('http://localhost:3000/api/purchase-master/next-no')
      const nextJson = await nextRes.json()
      if (!nextJson.success) throw new Error('Could not generate PO number')
      const poNo   = nextJson.poNo
      const poDate = new Date().toISOString().split('T')[0]

      // Update PR status to Approved and save the generated PO number
      const prRes = await fetch(`http://localhost:3000/api/purchase-request/${pr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prDate: pr.prDate, requiredDate: pr.requiredDate,
          department: pr.department, departmentId: pr.departmentId,
          requestingUser: pr.requestingUser,
          team: pr.team, teamId: pr.teamId,
          requestingFor: pr.requestingFor, requestingForId: pr.requestingForId,
          remarks: pr.remarks,
          status: 'Approved', poNo, poDate,
          updatedBy: 'Admin',
          items: pr.details || [],
        }),
      })
      const prJson = await prRes.json()
      if (!prJson.success) throw new Error(prJson.message || 'Failed to approve request')

      const patch = r => r.id === pr.id ? { ...r, status: 'Approved', poNo, poDate } : r
      setAllData(prev => prev.map(patch))
      setData(prev => prev.map(patch))
      setViewPR(null)

      // Pre-fill PurchaseOrderEntry with PR data; PO will be created there
      localStorage.setItem('velson:po-prefill', JSON.stringify({
        poNo, poDate, prNo: pr.prNo, items: pr.details || [],
      }))
      window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
    } catch (err) {
      console.error('Approve failed:', err)
      alert('Approval failed: ' + err.message)
    } finally {
      setApproving(false)
    }
  }

  /* ── reject ── */
  const handleReject = async (pr) => {
    setRejecting(true)
    try {
      await fetch(`http://localhost:3000/api/purchase-request/${pr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prDate: pr.prDate, requiredDate: pr.requiredDate,
          department: pr.department, departmentId: pr.departmentId,
          requestingUser: pr.requestingUser,
          team: pr.team, teamId: pr.teamId,
          requestingFor: pr.requestingFor, requestingForId: pr.requestingForId,
          remarks: pr.remarks,
          status: 'Rejected',
          updatedBy: 'Admin',
          items: pr.details || [],
        }),
      })
      const patch = r => r.id === pr.id ? { ...r, status: 'Rejected' } : r
      setAllData(prev => prev.map(patch))
      setData(prev => prev.map(patch))
      setViewPR(null)
    } catch (err) {
      console.error('Reject failed:', err)
    } finally {
      setRejecting(false)
    }
  }

  /* ── column cell renderer ── */
  const renderCell = (pr, col, jobNo) => {
    switch (col) {
      case 'Request No':    return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{pr.prNo}</td>
      case 'Request Date':  return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(pr.prDate)}</td>
      case 'Department Name': return <td key={col} className="p-1.5 border-x border-slate-200">{pr.department || ''}</td>
      case 'Job No':        return <td key={col} className="p-1.5 border-x border-slate-200">{jobNo}</td>
      case 'Request User':  return <td key={col} className="p-1.5 border-x border-slate-200">{pr.requestingUser || ''}</td>
      case 'Required Date': return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(pr.requiredDate)}</td>
      case 'Approval':      return <td key={col} className="p-1.5 border-x border-slate-200"><span className={`font-medium ${pr.status === 'Approved' ? 'text-green-600' : pr.status === 'Rejected' ? 'text-red-500' : 'text-amber-600'}`}>{pr.status}</span></td>
      case 'PO No':         return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{pr.poNo || ''}</td>
      case 'PO Date':       return <td key={col} className="p-1.5 border-x border-slate-200">{pr.poDate ? fmtDate(pr.poDate) : ''}</td>
      default: return null
    }
  }

  const totalActionCols = 3 // View + Edit + Delete always visible
  const colSpanTotal    = visibleCols.length + totalActionCols

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Purchase</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Print Purchase Request</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">Print Purchase Request</h2>
          <div className="flex gap-2">
            <button
              onClick={handleHeaderDelete}
              disabled={activeRow === null}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
            >
              <Printer className="w-3 h-3" /> Print Purchase Request
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
            <button
              onClick={handleSearch}
              className="flex items-center gap-1.5 px-4 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[12px] font-medium transition-colors shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Search
            </button>
          </div>

          {/* Export + utility controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-500">LS</span>
              <input value={displayData.length} readOnly className="w-10 text-center border border-slate-300 rounded text-[12px] py-0.5 bg-slate-50" />
            </div>
            <div className="h-4 w-px bg-slate-300" />
            <button onClick={handleDoc} className={iconBtn} title="Export as Word document">
              <FileText className="w-4 h-4 text-[#0097A7]" /> Dos
            </button>
            <button onClick={handleExcel} className={iconBtn} title="Export as Excel/CSV">
              <FileSpreadsheet className="w-4 h-4 text-[#0097A7]" /> Excel
            </button>
            <button onClick={handlePrint} className={iconBtn} title="Export as PDF / Print">
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
              placeholder="Search across Request No, Department, User, Status, PO No, Job No…"
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
                  {/* Action columns always visible */}
                  <th className="p-2 font-medium border-x border-slate-700 text-center">View</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Edit</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 text-[12px]">
                      {filterText ? 'No matching records' : 'No records found'}
                    </td>
                  </tr>
                ) : displayData.map((pr, i) => {
                  const jobNo = pr.details?.map(d => d.jobNo).filter(Boolean).join(', ') || ''
                  return (
                    <tr
                      key={pr.id}
                      onClick={() => setActiveRow(i)}
                      className={`cursor-pointer transition-colors ${activeRow === i ? 'bg-[#0097A7]/20' : 'hover:bg-slate-50'}`}
                    >
                      {visibleCols.map(col => renderCell(pr, col, jobNo))}
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); setViewPR(pr) }}
                          className="text-[#0097A7] hover:text-[#007a87] transition-colors"
                          title="View details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button
                          onClick={e => handleEdit(pr, e)}
                          className="text-amber-500 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </td>
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteTarget(pr) }}
                          className="text-red-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
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

      {/* ── View Modal ── */}
      {viewPR && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { if (!approving && !rejecting) setViewPR(null) }} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-[640px] max-h-[85vh] overflow-hidden flex flex-col">
            <div className={`px-5 py-3 flex items-center justify-between shrink-0 ${viewPR.status === 'Approved' ? 'bg-green-600' : viewPR.status === 'Rejected' ? 'bg-red-500' : 'bg-[#0097A7]'}`}>
              <div>
                <h3 className="text-white font-semibold text-[14px]">Purchase Request Details</h3>
                <p className="text-white/70 text-[11px] mt-0.5">{viewPR.prNo} &nbsp;·&nbsp; {viewPR.status}</p>
              </div>
              <button onClick={() => setViewPR(null)} disabled={approving || rejecting} className="text-white/80 hover:text-white transition-colors disabled:opacity-40">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] shrink-0 border-b border-slate-100">
              {[
                ['Request No',      viewPR.prNo],
                ['Request Date',    fmtDate(viewPR.prDate)],
                ['Department',      viewPR.department],
                ['Requesting User', viewPR.requestingUser],
                ['Required Date',   fmtDate(viewPR.requiredDate)],
                ['Status',          viewPR.status],
                ['Team',            viewPR.team],
                ['Requesting For',  viewPR.requestingFor],
                ['Remarks',         viewPR.remarks],
                ['PO No',           viewPR.poNo],
                ['PO Date',         viewPR.poDate ? fmtDate(viewPR.poDate) : null],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-32 font-semibold text-slate-500 shrink-0">{label}</span>
                  <span className="text-slate-400 shrink-0">:</span>
                  <span className={`text-slate-800 ${label === 'Status' ? (viewPR.status === 'Approved' ? 'text-green-600 font-semibold' : viewPR.status === 'Rejected' ? 'text-red-500 font-semibold' : 'text-amber-600 font-semibold') : ''}`}>
                    {value || '-'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <p className="text-[12px] font-semibold text-slate-600 mb-2">Items</p>
              {viewPR.details?.length > 0 ? (
                <table className="w-full text-[11.5px] border border-slate-200 rounded">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      {['#','Item Code','Item Name','Specification','Qty','UOM','Job No','Machine No','Purpose'].map(h => (
                        <th key={h} className="px-2 py-1 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewPR.details.map((d, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-2 py-1">{idx + 1}</td>
                        <td className="px-2 py-1">{d.itemCode || '-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{d.itemName || '-'}</td>
                        <td className="px-2 py-1">{d.specification || '-'}</td>
                        <td className="px-2 py-1">{d.qty ?? '-'}</td>
                        <td className="px-2 py-1">{d.uom || '-'}</td>
                        <td className="px-2 py-1">{d.jobNo || '-'}</td>
                        <td className="px-2 py-1">{d.machineNo || '-'}</td>
                        <td className="px-2 py-1">{d.purpose || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[12px] text-slate-400 italic">No items</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11.5px] text-slate-400">{viewPR.details?.length || 0} item(s)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewPR(null)}
                  disabled={approving || rejecting}
                  className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-200 transition-colors disabled:opacity-40"
                >
                  Close
                </button>

                {/* Reject — shown only when pending */}
                {viewPR.status !== 'Approved' && viewPR.status !== 'Rejected' && (
                  <button
                    onClick={() => handleReject(viewPR)}
                    disabled={approving || rejecting}
                    className="px-5 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {rejecting
                      ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Rejecting…</>
                      : 'Reject'}
                  </button>
                )}

                {/* Approve — shown only when pending */}
                {viewPR.status !== 'Approved' && viewPR.status !== 'Rejected' && (
                  <button
                    onClick={() => handleApprove(viewPR)}
                    disabled={approving || rejecting}
                    className="px-5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[12px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {approving
                      ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Approving…</>
                      : 'Approve'}
                  </button>
                )}

                {/* Status badge when already actioned */}
                {viewPR.status === 'Approved' && (
                  <span className="px-4 py-1.5 bg-green-100 text-green-700 text-[12px] font-semibold rounded-lg border border-green-200">
                    ✓ Approved
                  </span>
                )}
                {viewPR.status === 'Rejected' && (
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
        message={`Delete purchase request ${deleteTarget?.prNo}? This action cannot be undone.`}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </div>
  )
}
