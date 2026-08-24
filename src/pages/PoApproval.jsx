import React, { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Printer, AlertTriangle } from 'lucide-react'
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

const doExcelExport = (data) => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const lines = [
    cols.join(','),
    ...rows.map(r => cols.map(c => `"${String(r[c]).replace(/"/g,'""')}"`).join(','))
  ]
  const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `pending-purchase-orders-${Date.now()}.csv`)
}

const doDocExport = (data) => {
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
<h2>Pending Purchase Order List</h2>
<p>Generated: ${new Date().toLocaleDateString()}</p>
<table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
<p style="margin-top:8px">Total Records: ${rows.length}</p>
</body></html>`
  const blob = new Blob([html], { type: 'application/msword' })
  downloadBlob(blob, `pending-purchase-orders-${Date.now()}.doc`)
}

const doPrint = (data) => {
  const rows = buildRows(data)
  const cols = Object.keys(rows[0] || {})
  const thead = cols.map(c => `<th>${c}</th>`).join('')
  const tbody = rows.map((r, i) =>
    `<tr class="${i%2?'alt':''}"><td>${cols.map(c => r[c]).join('</td><td>')}</td></tr>`
  ).join('')
  const win = window.open('', '_blank', 'width=1100,height=750')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pending Purchase Orders</title>
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
<h2>Pending Purchase Order List</h2>
<p class="meta">Printed: ${new Date().toLocaleDateString()} &nbsp;|&nbsp; Records: ${rows.length}</p>
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

  const [selectedPoId, setSelectedPoId] = useState(null)
  const [data, setData]             = useState([])
  const [loading, setLoading]       = useState(false)

  const [approving, setApproving]   = useState(false)
  const [rejecting, setRejecting]   = useState(false)

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectTargetPo, setRejectTargetPo]   = useState(null)
  const [rejectionReason, setRejectionReason] = useState('')

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
      // Display only PO records currently in Pending Approval status
      const pendingList = list.filter(r => (r.status || 'Pending').toLowerCase() === 'pending')
      setData(pendingList)
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
          (r.status || '').toLowerCase().includes(q) ||
          (r.remarks || '').toLowerCase().includes(q)
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
  const handleExcel = () => doExcelExport(displayData)
  const handleDoc   = () => doDocExport(displayData)
  const handlePrint = () => doPrint(displayData)

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
        // Remove from pending list
        setData(prev => prev.filter(r => r.id !== po.id))
        setSelectedPoId(null)
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

  /* ── open reject modal ── */
  const handleOpenReject = (po) => {
    setRejectTargetPo(po)
    setRejectionReason('')
    setRejectModalOpen(true)
  }

  /* ── confirm reject with mandatory reason ── */
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please enter a rejection reason')
      return
    }
    if (!rejectTargetPo) return

    setRejecting(true)
    try {
      const res = await api.put(`/api/purchase-master/${rejectTargetPo.id}`, {
        ...rejectTargetPo,
        items: rejectTargetPo.details || [],
        status: 'Rejected',
        remarks: rejectionReason.trim(),
        updatedBy: 'Admin'
      })
      const json = res.data
      if (json.success) {
        toast.warning(`Purchase Order ${rejectTargetPo.poNo} rejected.`)
        // Remove from pending list
        setData(prev => prev.filter(r => r.id !== rejectTargetPo.id))
        setSelectedPoId(null)
        setRejectModalOpen(false)
        setRejectTargetPo(null)
        setRejectionReason('')
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
      case 'Status':         return <td key={col} className="p-1.5 border-x border-slate-200"><span className={`font-medium ${statusColor(row.status)}`}>{row.status || 'Pending'}</span></td>
      case 'Remarks':        return <td key={col} className="p-1.5 border-x border-slate-200 text-slate-500">{row.remarks || '—'}</td>
      default: return null
    }
  }

  const colSpanTotal = visibleCols.length

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
          <h2 className="text-white font-semibold text-[14px]">Pending Purchase Order Details</h2>
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
          <div className="flex items-center gap-3">
            <span className="text-[12.5px] font-semibold text-slate-600">Pending Orders for Approval</span>
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[11px] font-bold rounded-full">{data.length}</span>
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
              <Filter className="w-4 h-4" /> Filter
            </button>

            {/* Column visibility dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className={`${iconBtn} ${settingsOpen ? 'text-[#0097A7]' : ''}`}
                title="Configure visible columns"
              >
                <Settings className="w-4 h-4" />
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-6 z-50 bg-white border border-slate-200 rounded shadow-lg p-2.5 w-48 text-[12px] space-y-1.5">
                  <p className="font-semibold text-slate-600 border-b border-slate-100 pb-1 mb-1 text-[11px] uppercase tracking-wide">
                    Toggle Columns
                  </p>
                  {ALL_COLS.map(col => (
                    <label key={col} className="flex items-center gap-2 cursor-pointer hover:text-[#0097A7] select-none">
                      <input
                        type="checkbox"
                        checked={!hiddenCols.has(col)}
                        onChange={() => toggleCol(col)}
                        className="accent-[#0097A7] rounded"
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inline column filter search input */}
        {filterOpen && (
          <div className="px-4 py-2 bg-[#0097A7]/5 border-b border-[#0097A7]/20 flex items-center gap-2 shrink-0">
            <span className="text-[11px] font-semibold text-[#0097A7] uppercase tracking-wide">Filter:</span>
            <input
              type="text"
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              placeholder="Type to filter across all columns…"
              className="border border-[#0097A7]/40 rounded px-2 py-0.5 text-[12px] w-72 bg-white focus:outline-none focus:border-[#0097A7]"
              autoFocus
            />
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600 text-[12px]">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-[11px] text-slate-400 ml-auto">{displayData.length} matches</span>
          </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto border-b border-slate-200">
          <table className="w-full text-[12px] text-left border-collapse">
            <thead className="bg-slate-100 text-slate-600 sticky top-0 border-b border-slate-200 uppercase text-[11px] tracking-wider select-none z-10">
              <tr>
                {visibleCols.map(col => (
                  <th key={col} className="p-2 font-semibold border-x border-slate-200 whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400">
                    Loading pending purchase orders…
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 italic">
                    No pending purchase orders waiting for approval.
                  </td>
                </tr>
              ) : (
                displayData.map((row, idx) => (
                  <React.Fragment key={row.id}>
                    <tr
                      onClick={() => setSelectedPoId(selectedPoId === row.id ? null : row.id)}
                      className={`cursor-pointer border-b border-slate-100 transition-colors
                        ${selectedPoId === row.id ? 'bg-[#0097A7]/10 font-medium' : idx % 2 === 1 ? 'bg-slate-50/60 hover:bg-slate-100/60' : 'hover:bg-slate-50'}`}
                    >
                      {visibleCols.map(col => renderCell(row, col))}
                    </tr>

                    {/* Inline detail accordion */}
                    {selectedPoId === row.id && (
                      <tr>
                        <td colSpan={colSpanTotal} className="p-0 border-b border-[#0097A7]/30 bg-slate-50">
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between bg-white border border-slate-200 rounded p-3 shadow-xs">
                              <div>
                                <span className="font-bold text-slate-800 text-[13px]">{row.poNo}</span>
                                <span className="text-slate-400 mx-2">|</span>
                                <span className="text-slate-600">{row.supplier?.supplierName}</span>
                                <span className="text-slate-400 mx-2">|</span>
                                <span className="text-slate-500">PO Date: {fmtDate(row.poDate)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleApprove(row)}
                                  disabled={approving || !canEdit}
                                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded font-bold text-[12px] shadow-sm transition-colors disabled:opacity-50"
                                >
                                  {approving ? 'Approving…' : 'Approve PO'}
                                </button>
                                <button
                                  onClick={() => handleOpenReject(row)}
                                  disabled={rejecting || !canEdit}
                                  className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded font-bold text-[12px] shadow-sm transition-colors disabled:opacity-50"
                                >
                                  Reject PO
                                </button>
                              </div>
                            </div>

                            {/* Details items table */}
                            <div className="bg-white rounded border border-slate-200 overflow-hidden">
                              <table className="w-full text-[11.5px]">
                                <thead className="bg-slate-100 text-slate-600 uppercase text-[10.5px]">
                                  <tr>
                                    <th className="p-1.5 text-center">S.No</th>
                                    <th className="p-1.5 text-left">Item Code</th>
                                    <th className="p-1.5 text-left">Item Name</th>
                                    <th className="p-1.5 text-left">Pur. Req No</th>
                                    <th className="p-1.5 text-right">Qty</th>
                                    <th className="p-1.5 text-right">Unit Price</th>
                                    <th className="p-1.5 text-right">Amount</th>
                                    <th className="p-1.5 text-right">GST %</th>
                                    <th className="p-1.5 text-right">Net Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.details && row.details.length > 0 ? (
                                    row.details.map((d, i) => (
                                      <tr key={d.id || i} className="border-t border-slate-100">
                                        <td className="p-1.5 text-center text-slate-500">{i + 1}</td>
                                        <td className="p-1.5 font-medium text-[#0097A7]">{d.itemCode || '—'}</td>
                                        <td className="p-1.5" title={d.itemName || ''}>{d.itemName || '—'}</td>
                                        <td className="p-1.5">{d.purchaseReqNo || '—'}</td>
                                        <td className="p-1.5 text-right font-semibold">{d.qty}</td>
                                        <td className="p-1.5 text-right">{parseFloat(d.unitPrice || 0).toFixed(2)}</td>
                                        <td className="p-1.5 text-right font-medium">{parseFloat(d.amount || 0).toFixed(2)}</td>
                                        <td className="p-1.5 text-right">{d.gstPer}%</td>
                                        <td className="p-1.5 text-right font-bold text-slate-700">{parseFloat(d.netAmt || 0).toFixed(2)}</td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan={9} className="p-3 text-center text-slate-400 italic">No line items recorded.</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mandatory Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-red-600 px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <h3 className="text-[13px] font-bold">Reject Purchase Order — {rejectTargetPo?.poNo}</h3>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-[12.5px]">
              <p className="text-slate-600 font-medium">
                Please specify the mandatory rejection reason. This will be automatically populated into the Remarks column of the PO details grid.
              </p>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1">
                  Rejection Reason <span className="text-red-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Enter detailed reason for rejection..."
                  className="w-full border border-slate-300 rounded px-2.5 py-1.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 resize-none bg-white"
                  autoFocus
                />
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting || !rejectionReason.trim()}
                className="px-5 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded font-bold text-[12px] shadow-sm"
              >
                {rejecting ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
