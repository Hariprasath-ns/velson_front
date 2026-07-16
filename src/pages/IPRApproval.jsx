import React, { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Printer } from 'lucide-react'
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
  'Request User', 'Required Date', 'Approval',
]

/* ─── export helpers ──────────────────────────────────────── */
const buildRows = (data) =>
  data.map(pr => ({
    'Request No':      pr.prNo || '',
    'Request Date':    fmtDate(pr.prDate),
    'Department Name': pr.department || '',
    'Job No':          pr.details?.map(d => d.jobNo).filter(Boolean).join('; ') || '',
    'Request User':    pr.requestingUser || '',
    'Required Date':   fmtDate(pr.requiredDate),
    'Approval':        pr.status || '',
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
  const blob = new Blob(['' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
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

export default function PRApproval() {
  const { canEdit, canPrint } = useModulePermission('ipr-approval')
  const toast = useToast()

  const [fromDate, setFromDate]     = useState('2026-04-01')
  const [toDate, setToDate]         = useState(new Date().toISOString().split('T')[0])
  const [selectedPrId, setSelectedPrId] = useState(null)
  const [allData, setAllData]       = useState([])
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)

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

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/purchase-request?limit=10000', { skipGlobalLoader: true })
      const list = res.data?.data || []
      setAllData(list)
      setData(applyFilter(list, fromDate, toDate))
    } catch (err) {
      console.error('Error fetching purchase requests:', err)
      toast.error('Failed to load purchase requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  /* ── date search ── */
  const handleSearch = () => {
    setData(applyFilter(allData, fromDate, toDate))
    setSelectedPrId(null)
    setFilterText('')
  }

  const selectedPr = data.find(pr => pr.id === selectedPrId)

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

  /* ── approve ── */
  const handleApprove = async (pr) => {
    setApproving(true)
    try {
      // If PR already has a PO number, navigate to edit that existing PO
      if (pr.poNo) {
        const poListRes = await api.get('/api/purchase-master')
        const poListJson = poListRes.data
        if (poListJson.success) {
          const existingPO = poListJson.data.find(p => p.poNo === pr.poNo)
          if (existingPO) {
            localStorage.setItem('velson:po-edit', String(existingPO.id))
            window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
            return
          }
        }
      }

      // First-time approval: generate a new PO number
      const nextRes = await api.get('/api/purchase-master/next-no')
      const nextJson = nextRes.data
      if (!nextJson.success) throw new Error('Could not generate PO number')
      const poNo = nextJson.poNo
      const poDate = new Date().toISOString().split('T')[0]

      // Update PR status to Approved and save the generated PO number
      const payload = {
        prDate: pr.prDate,
        requiredDate: pr.requiredDate,
        department: pr.department,
        departmentId: pr.departmentId,
        requestingUser: pr.requestingUser,
        team: pr.team,
        teamId: pr.teamId,
        requestingFor: pr.requestingFor,
        requestingForId: pr.requestingForId,
        remarks: pr.remarks,
        status: 'Approved',
        poNo,
        poDate,
        updatedBy: 'Admin',
        items: pr.details || [],
      }

      const prRes = await api.put(`/api/purchase-request/${pr.id}`, payload)
      const prJson = prRes.data
      if (!prJson.success) throw new Error(prJson.message || 'Failed to approve request')

      toast.success(`Purchase Request ${pr.prNo} approved.`)

      const patch = r => r.id === pr.id ? { ...r, status: 'Approved', poNo, poDate } : r
      setAllData(prev => prev.map(patch))
      setData(prev => prev.map(patch))

      // Pre-fill PurchaseOrderEntry with PR data; PO will be created there
      localStorage.setItem('velson:po-prefill', JSON.stringify({
        poNo, poDate, prNo: pr.prNo, items: pr.details || [],
      }))
      window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
    } catch (err) {
      console.error('Approve failed:', err)
      toast.error('Approval failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setApproving(false)
    }
  }

  /* ── reject ── */
  const handleReject = async (pr) => {
    setRejecting(true)
    try {
      const payload = {
        prDate: pr.prDate,
        requiredDate: pr.requiredDate,
        department: pr.department,
        departmentId: pr.departmentId,
        requestingUser: pr.requestingUser,
        team: pr.team,
        teamId: pr.teamId,
        requestingFor: pr.requestingFor,
        requestingForId: pr.requestingForId,
        remarks: pr.remarks,
        status: 'Rejected',
        updatedBy: 'Admin',
        items: pr.details || [],
      }
      await api.put(`/api/purchase-request/${pr.id}`, payload)
      toast.warning(`Purchase Request ${pr.prNo} rejected.`)
      const patch = r => r.id === pr.id ? { ...r, status: 'Rejected' } : r
      setAllData(prev => prev.map(patch))
      setData(prev => prev.map(patch))
    } catch (err) {
      console.error('Reject failed:', err)
      toast.error('Rejection failed: ' + (err.response?.data?.message || err.message))
    } finally {
      setRejecting(false)
    }
  }


  const renderCell = (pr, col, jobNo) => {
    switch (col) {
      case 'Request No':    return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{pr.prNo}</td>
      case 'Request Date':  return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(pr.prDate)}</td>
      case 'Department Name': return <td key={col} className="p-1.5 border-x border-slate-200">{pr.department || ''}</td>
      case 'Job No':        return <td key={col} className="p-1.5 border-x border-slate-200">{jobNo}</td>
      case 'Request User':  return <td key={col} className="p-1.5 border-x border-slate-200">{pr.requestingUser || ''}</td>
      case 'Required Date': return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(pr.requiredDate)}</td>
      case 'Approval':      return <td key={col} className="p-1.5 border-x border-slate-200"><span className={`font-medium ${pr.status === 'Approved' ? 'text-green-600' : pr.status === 'Rejected' ? 'text-red-500' : 'text-amber-600'}`}>{pr.status}</span></td>
      default: return null
    }
  }

  const colSpanTotal = visibleCols.length

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        <span className="hover:text-[#0097A7] cursor-pointer">Approval</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">PR Approval</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">PR Approval Pending</h2>
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
              placeholder="Search across Request No, Department, User, Status, Job No…"
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
                ) : displayData.map((pr, i) => {
                  const jobNo = pr.details?.map(d => d.jobNo).filter(Boolean).join(', ') || ''
                  return (
                    <tr
                      key={pr.id}
                      onClick={() => setSelectedPrId(pr.id)}
                      className={`cursor-pointer transition-colors ${selectedPrId === pr.id ? 'bg-[#0097A7]/10 font-semibold' : 'hover:bg-slate-50'}`}
                    >
                      {visibleCols.map(col => renderCell(pr, col, jobNo))}
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

      {/* Modal Popup Overlay */}
      {selectedPr && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedPrId(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-[#0097A7] px-5 py-3.5 flex items-center justify-between shrink-0">
              <h3 className="text-white font-semibold text-[15px]">
                Purchase Request Details - <span className="font-mono">{selectedPr.prNo}</span>
              </h3>
              <button
                onClick={() => setSelectedPrId(null)}
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
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Request No</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800 font-mono font-semibold">{selectedPr.prNo}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Department</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPr.department || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Requesting User</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPr.requestingUser || selectedPr.createdBy || '—'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Required Date</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{fmtDate(selectedPr.requiredDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Team</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPr.team || '—'}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Requesting For</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPr.requestingFor || '—'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Status</span>
                    <span className="text-slate-400">:</span>
                    <span className={`font-semibold ${selectedPr.status === 'Approved' ? 'text-green-600' : selectedPr.status === 'Rejected' ? 'text-red-500' : 'text-amber-600'}`}>{selectedPr.status}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-32 font-semibold text-slate-500 shrink-0">Remarks</span>
                    <span className="text-slate-400">:</span>
                    <span className="text-slate-800">{selectedPr.remarks || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Item table */}
              <div>
                <p className="text-[13px] font-bold text-slate-700 mb-2.5">Requested Items</p>
                {selectedPr.details?.length > 0 ? (
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-[12px] border-collapse">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          {['#','Item Code','Item Name','Specification','Qty','UOM','Job No','Machine No','Purpose'].map(h => (
                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 border-r border-slate-200 last:border-r-0">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPr.details.map((d, idx) => (
                          <tr key={idx} className={`border-b border-slate-200 last:border-b-0 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono text-[#0097A7] border-r border-slate-200">{d.itemCode || '—'}</td>
                            <td className="px-3 py-2 font-medium text-slate-800 border-r border-slate-200">{d.itemName || '—'}</td>
                            <td className="px-3 py-2 text-slate-600 border-r border-slate-200">{d.specification || '—'}</td>
                            <td className="px-3 py-2 font-bold text-slate-900 border-r border-slate-200">{d.qty ?? 0}</td>
                            <td className="px-3 py-2 text-slate-500 border-r border-slate-200">{d.uom || '—'}</td>
                            <td className="px-3 py-2 text-slate-600 border-r border-slate-200">{d.jobNo || '—'}</td>
                            <td className="px-3 py-2 text-slate-600 border-r border-slate-200">{d.machineNo || '—'}</td>
                            <td className="px-3 py-2 text-slate-500">{d.purpose || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-[12px] text-slate-400 italic">No items associated with this request.</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex justify-end items-center border-t border-slate-200 gap-3 shrink-0">
              {selectedPr.status === 'Pending' ? (
                <>
                  <button
                    onClick={() => handleReject(selectedPr)}
                    disabled={approving || rejecting || !canEdit}
                    title={!canEdit ? "No permission to reject" : ""}
                    className={`px-6 py-2 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 active:scale-95
                      ${!canEdit ? 'bg-slate-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {rejecting ? 'Rejecting…' : 'Reject'}
                  </button>
                  <button
                    onClick={() => handleApprove(selectedPr)}
                    disabled={approving || rejecting || !canEdit}
                    title={!canEdit ? "No permission to approve" : ""}
                    className={`px-6 py-2 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60 flex items-center gap-1.5 active:scale-95
                      ${!canEdit ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0097A7] hover:bg-[#007a87]'}`}
                  >
                    {approving ? 'Approving…' : 'Approve'}
                  </button>
                </>
              ) : selectedPr.status === 'Approved' ? (
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
      )}
    </div>
  )
}