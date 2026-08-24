/* eslint-disable */
import { useState, useEffect } from 'react'
import { ChevronRight, ChevronDown, Search, Trash2, Printer, X, RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { SpinnerLoader } from '../components/LocalLoader'
import api from '../services/api'

const today    = new Date().toISOString().split('T')[0]
const ago30    = new Date(Date.now() - 30*24*60*60*1000).toISOString().split('T')[0]
const PAGE_SIZES = [5, 10, 25, 50]

const fmtDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day:'2-digit', month:'2-digit', year:'numeric' })
}

const statusBadge = (s) => {
  const map = {
    Draft:    'bg-slate-200 text-slate-800 font-bold border border-slate-300',
    Pending:  'bg-amber-500 text-white font-bold shadow-xs',
    Approved: 'bg-emerald-600 text-white font-bold shadow-xs',
    Rejected: 'bg-rose-600 text-white font-bold shadow-xs',
  }
  return map[s] ?? 'bg-slate-200 text-slate-700'
}

const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] bg-white'

const getRejectionReason = (r) => {
  if (!r) return '—'
  if (r.rejectionReason) return r.rejectionReason
  if (!r.remarks) return '—'
  const match = r.remarks.match(/Rejection Reason:\s*([^|]+)/i)
  if (match) return match[1].trim()
  if (r.status === 'Rejected') return r.remarks
  return '—'
}

const HEADER_COLS_BASE = ['','Request No','Request Date','Department','Requesting User','Required Date','Status','Reason','Requesting For','Vehicle Name','Created By','Created Date']

export default function PrintMaterialRequest() {
  const toast = useToast()

  const pickMode = window.__velsonMrPickMode === true

  const [allRows,   setAllRows]   = useState([])
  const [loading,   setLoading]   = useState(false)
  const [fromDate,  setFromDate]  = useState(ago30)
  const [toDate,    setToDate]    = useState(today)
  const [search,    setSearch]    = useState('')
  const [pageSize,  setPageSize]  = useState(10)
  const [page,      setPage]      = useState(1)
  const [expanded,  setExpanded]  = useState(null)
  const [selected,  setSelected]  = useState(null)

  const handlePickSelect = (row) => {
    window.__velsonMrPickMode = false
    window.__velsonMrPickId = row.id
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseRequestEntry' } }))
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/material-request', { skipGlobalLoader: true })
      setAllRows(res.data?.data || [])
    } catch {
      toast.error('Failed to load material requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = allRows.filter(r => {
    if (pickMode && r.status !== 'Approved') return false
    const rd = r.requestDate ? r.requestDate.slice(0, 10) : ''
    if (fromDate && rd < fromDate) return false
    if (toDate   && rd > toDate)   return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return (
        (r.mrNo          || '').toLowerCase().includes(q) ||
        (r.departmentTo  || '').toLowerCase().includes(q) ||
        (r.requestingUser|| '').toLowerCase().includes(q) ||
        (r.requestingFor || '').toLowerCase().includes(q) ||
        (r.storeName     || '').toLowerCase().includes(q) ||
        (r.vehicleName   || '').toLowerCase().includes(q) ||
        (r.status        || '').toLowerCase().includes(q) ||
        (r.remarks       || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const toggleExpand = (id) => setExpanded(prev => prev === id ? null : id)

  const handleDelete = async () => {
    if (!selected) { toast.warning('Select a row to delete.'); return }
    try {
      await api.delete(`/api/material-request/${selected}`)
      toast.success('Record deleted.')
      setSelected(null)
      setExpanded(null)
      fetchData()
    } catch {
      toast.error('Failed to delete.')
    }
  }

  const handlePrint = (targetMr = null) => {
    const mr = targetMr || allRows.find(r => r.id === selected) || filtered[0]
    if (!mr) {
      toast.warning('Please select a material request to print.')
      return
    }

    const statusColors = {
      Approved: { bg: '#e8f5e9', text: '#2e7d32', border: '#a5d6a7' },
      Rejected: { bg: '#ffebee', text: '#c62828', border: '#ef9a9a' },
      Pending:  { bg: '#fff8e1', text: '#f57f17', border: '#ffe082' },
      Draft:    { bg: '#f5f5f5', text: '#616161', border: '#e0e0e0' },
    }
    const sc = statusColors[mr.status] || { bg: '#f5f5f5', text: '#333', border: '#ccc' }

    const details = mr.details || []
    const detailRows = details.map((d, i) => `
      <tr style="${i % 2 === 1 ? 'background:#f8fafc;' : ''}">
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${i + 1}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${d.modelName || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;font-weight:bold;color:#0097A7;">${d.itemCode || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;">${d.itemName || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;font-weight:bold;">${d.requestedQty ?? '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${d.materialGrade || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;text-align:center;">${d.unit || '—'}</td>
        <td style="padding:6px 8px;border:1px solid #cbd5e1;">${d.remarks || '—'}</td>
      </tr>
    `).join('')

    const win = window.open('', '_blank', 'width=1000,height=750')
    win.document.write(`<!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Material Request - ${mr.mrNo}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 11.5px; color: #1e293b; margin: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #0097A7; padding-bottom: 10px; margin-bottom: 14px; }
          .title { font-size: 16px; font-weight: bold; color: #0097A7; text-transform: uppercase; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase; background: ${sc.bg}; color: ${sc.text}; border: 1.5px solid ${sc.border}; }
          .meta-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; background: #f8fafc; padding: 12px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 14px; }
          .meta-item { font-size: 11px; }
          .meta-lbl { font-weight: bold; color: #64748b; display: inline-block; width: 110px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #0097A7; color: white; padding: 6px 8px; font-size: 11px; text-transform: uppercase; border: 1px solid #00838f; }
          .footer { margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
          @media print { @page { margin: 1.2cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">Material Request Slip</div>
            <div style="font-size:12px;color:#475569;margin-top:2px;">Request No: <strong>${mr.mrNo}</strong></div>
          </div>
          <div>
            <span class="status-badge">${mr.status || 'Pending'}</span>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-item"><span class="meta-lbl">Request Date:</span> ${fmtDate(mr.requestDate)}</div>
          <div class="meta-item"><span class="meta-lbl">Department:</span> ${mr.departmentTo || '—'}</div>
          <div class="meta-item"><span class="meta-lbl">Requesting User:</span> ${mr.requestingUser || '—'}</div>
          <div class="meta-item"><span class="meta-lbl">Required Date:</span> ${fmtDate(mr.requiredDate)}</div>
          <div class="meta-item"><span class="meta-lbl">Requesting For:</span> ${mr.requestingFor || '—'}</div>
          <div class="meta-item"><span class="meta-lbl">Vehicle Name:</span> ${mr.vehicleName || '—'}</div>
          <div class="meta-item"><span class="meta-lbl">Created By:</span> ${mr.createdBy || '—'}</div>
          <div class="meta-item"><span class="meta-lbl">Created Date:</span> ${fmtDate(mr.createdAt)}</div>
          <div class="meta-item"><span class="meta-lbl">Store Name:</span> ${mr.storeName || '—'}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px;">S.No</th>
              <th>Model Name</th>
              <th>Item Code</th>
              <th>Item Name</th>
              <th style="width:70px;">Req Qty</th>
              <th>Material Grade</th>
              <th style="width:60px;">Unit</th>
              <th>Remarks</th>
            </tr>
          </thead>
          <tbody>
            ${detailRows || '<tr><td colspan="8" style="text-align:center;padding:12px;color:#94a3b8;">No line items</td></tr>'}
          </tbody>
        </table>

        ${mr.remarks ? `<div style="margin-top:12px;padding:8px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;"><strong style="color:#64748b;">Remarks:</strong> ${mr.remarks}</div>` : ''}

        <div class="footer">
          <div>Prepared By: <strong>${mr.createdBy || 'Admin'}</strong></div>
          <div>Status: <strong style="color:${sc.text};">${mr.status}</strong></div>
          <div>Authorized Signatory: __________________</div>
        </div>
      </body>
    </html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Print Material Request</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">
            {pickMode ? 'Select an Approved Material Request' : 'Material Request List'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={fetchData} className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">
              <RefreshCw className="w-3 h-3"/> Refresh
            </button>
            {!pickMode && <>
              <button onClick={handleDelete} className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">
                <Trash2 className="w-3 h-3"/> Delete
              </button>
              <button onClick={() => handlePrint()} className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors font-semibold">
                <Printer className="w-3 h-3"/> Print MR
              </button>
            </>}
            <button
              onClick={() => {
                if (pickMode) { window.__velsonMrPickMode = false }
                window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: pickMode ? 'PurchaseRequestEntry' : 'PrintMaterialRequest' } }))
              }}
              className="flex items-center gap-1 px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors"
            >
              <X className="w-3 h-3"/> {pickMode ? 'Cancel' : 'Close'}
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-1.5">
            <label className="text-[12px] font-semibold text-slate-600 whitespace-nowrap">From Date:</label>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} className={inp} />
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[12px] font-semibold text-slate-600 whitespace-nowrap">To Date:</label>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} className={inp} />
          </div>
          <button onClick={() => setPage(1)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12.5px] font-semibold rounded transition-colors shadow-sm">
            <Search className="w-3.5 h-3.5"/> Search
          </button>
        </div>

        {/* Search bar on LEFT, Show entries on RIGHT */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <label className="text-[12px] font-semibold text-slate-600">Search:</label>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className={`${inp} w-80 md:w-96`}
              placeholder="Search by MR No, Department, User, Vehicle, Status..."
            />
          </div>

          <div className="flex items-center gap-2 text-[12.5px] text-slate-600">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className={`${inp} w-16`}>
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          {loading ? (
            <SpinnerLoader message="Loading material requests…" />
          ) : (
            <table className="min-w-full text-[12.5px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {[...HEADER_COLS_BASE, ...(pickMode ? [''] : [])].map(h => (
                    <th key={h} className="px-3 py-2 text-center font-bold text-slate-600 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={HEADER_COLS_BASE.length + (pickMode ? 1 : 0)} className="text-center py-12 text-slate-400 text-[13px]">No data available</td></tr>
                ) : paged.map((row, idx) => {
                  const isSelected = selected === row.id
                  const isExpanded = expanded === row.id
                  const rowBg = isSelected
                    ? 'bg-[#e3f2fd] border-l-2 border-l-[#0097A7]'
                    : idx % 2 === 1 ? 'bg-slate-50/50' : ''

                  return [
                    /* Master row */
                    <tr
                      key={row.id}
                      onClick={() => { setSelected(row.id); toggleExpand(row.id) }}
                      className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${rowBg}`}
                    >
                      <td className="px-2 py-2 text-center">
                        {isExpanded
                          ? <ChevronDown className="w-3.5 h-3.5 text-[#0097A7] mx-auto" />
                          : <ChevronRight className="w-3.5 h-3.5 text-slate-400 mx-auto" />}
                      </td>
                      <td className="px-3 py-2 text-center font-semibold text-[#0097A7] whitespace-nowrap">{row.mrNo}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">{fmtDate(row.requestDate)}</td>
                      <td className="px-3 py-2 text-center">{row.departmentTo || '—'}</td>
                      <td className="px-3 py-2 text-center">{row.requestingUser || '—'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">{fmtDate(row.requiredDate)}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${statusBadge(row.status)}`}>{row.status}</span>
                      </td>
                      <td className="px-3 py-2 text-center max-w-[160px] truncate" title={getRejectionReason(row)}>
                        {row.status === 'Rejected' ? (
                          <span className="text-red-600 font-medium text-[11.5px]">{getRejectionReason(row)}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">{row.requestingFor || '—'}</td>
                      <td className="px-3 py-2 text-center">{row.vehicleName || '—'}</td>
                      <td className="px-3 py-2 text-center">{row.createdBy || '—'}</td>
                      <td className="px-3 py-2 text-center whitespace-nowrap">{fmtDate(row.createdAt)}</td>
                      {pickMode && (
                        <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handlePickSelect(row)}
                            className="px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-semibold rounded transition-colors"
                          >
                            Select
                          </button>
                        </td>
                      )}
                    </tr>,

                    /* Expanded detail rows */
                    isExpanded && (
                      <tr key={`detail-${row.id}`}>
                        <td colSpan={HEADER_COLS_BASE.length + (pickMode ? 1 : 0)} className="px-0 py-0 bg-blue-50 border-b border-blue-100">
                          <div className="px-6 py-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Line Items — {row.mrNo}</p>
                              <button
                                onClick={(e) => { e.stopPropagation(); handlePrint(row) }}
                                className="flex items-center gap-1 px-2.5 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-semibold rounded shadow-xs transition-colors"
                              >
                                <Printer className="w-3 h-3" /> Print This MR
                              </button>
                            </div>
                            {(!row.details || row.details.length === 0) ? (
                              <p className="text-[12px] text-slate-400 italic">No items recorded.</p>
                            ) : (
                              <table className="w-full text-[12px] border border-slate-200 rounded bg-white">
                                <thead>
                                  <tr className="bg-slate-100 text-slate-600 text-[11px] uppercase">
                                    {['S.NO','Model Name','Item Code','Item Name','Requested Qty','Material Grade','Unit','Remarks'].map(h => (
                                      <th key={h} className="px-2 py-1.5 text-center font-bold whitespace-nowrap">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {row.details.map((d, i) => (
                                    <tr key={d.id} className={`border-t border-slate-100 ${i % 2 === 1 ? 'bg-white' : 'bg-slate-50/50'}`}>
                                      <td className="px-2 py-1 text-center text-slate-500">{d.slNo}</td>
                                      <td className="px-2 py-1 text-center">{d.modelName || '—'}</td>
                                      <td className="px-2 py-1 text-center font-medium text-[#0097A7]">{d.itemCode || '—'}</td>
                                      <td className="px-2 py-1">{d.itemName || '—'}</td>
                                      <td className="px-2 py-1 text-center font-semibold">{d.requestedQty ?? '—'}</td>
                                      <td className="px-2 py-1 text-center">{d.materialGrade || '—'}</td>
                                      <td className="px-2 py-1 text-center">{d.unit || '—'}</td>
                                      <td className="px-2 py-1">{d.remarks || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                            {row.remarks && (
                              <p className="mt-2 text-[12px] text-slate-500"><span className="font-semibold">Remarks:</span> {row.remarks}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  ]
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
          <span className="text-[12px] text-slate-500">
            {filtered.length === 0
              ? 'No entries'
              : `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, filtered.length)} of ${filtered.length} entries`}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page === 1} className="px-2 py-1.5 text-[11px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">«</button>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Previous</button>
            <span className="px-3 py-1.5 text-[12px] text-slate-600 font-semibold">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Next</button>
            <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="px-2 py-1.5 text-[11px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">»</button>
          </div>
        </div>
      </div>
    </div>
  )
}
