import { useState, useEffect, useRef } from 'react'
import { ChevronRight, FileText, FileSpreadsheet, File as FilePdf, Filter, Settings, X, Trash2, Eye, Pencil } from 'lucide-react'
import ConfirmDialog from '../components/ConfirmDialog'

const BASE = 'http://localhost:3000'
const today = new Date().toISOString().split('T')[0]
const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white'
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'
const iconBtn = 'flex items-center gap-1 text-[12px] text-slate-600 hover:text-[#0097A7] transition-colors cursor-pointer'

const Spinner = ({ cls = 'w-4 h-4' }) => (
  <span className={`${cls} border-2 border-current/30 border-t-current rounded-full animate-spin inline-block`}/>
)

const fmtDate = iso => {
  if (!iso) return '—'
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2,'0')}-${String(d.getMonth()+1).padStart(2,'0')}-${d.getFullYear()}`
}

/* ── export helpers ── */
const buildRows = data => data.map(r => ({
  'Gate Entry No': r.gateEntryNo || '',
  'Gate No':       r.gateNo || '',
  'Date':          fmtDate(r.gateEntryDate),
  'Invoice No':    r.invoiceNo || '',
  'PO No':         r.poNo || '',
  'Supplier Name': r.supplierName || '',
  'Carrier Name':  r.carrierName || '',
  'Vehicle No':    r.vehicleNo || '',
  'Status':        r.status || '',
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
  downloadBlob(new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), 'gate-entries.csv')
}

const doDocExport = data => {
  const rows = buildRows(data)
  if (!rows.length) return
  const cols = Object.keys(rows[0])
  const thead = cols.map(c => `<th style="padding:5px 8px;background:#0097A7;color:#fff;font-size:11px;">${c}</th>`).join('')
  const tbody = rows.map((r, i) => `<tr style="${i%2?'background:#f8fafc;':''}">
    ${cols.map(c => `<td style="padding:4px 8px;border:1px solid #e2e8f0;font-size:11px;">${r[c]}</td>`).join('')}</tr>`).join('')
  const html = `<html><head><meta charset="utf-8"></head><body>
    <h2>Gate Entry Report</h2>
    <table border="1" style="border-collapse:collapse;width:100%"><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </body></html>`
  downloadBlob(new Blob([html], { type: 'application/msword' }), 'gate-entries.doc')
}

const doPrint = data => {
  const rows = buildRows(data)
  const cols = Object.keys(rows[0] || {})
  const thead = cols.map(c => `<th>${c}</th>`).join('')
  const tbody = rows.map((r, i) => `<tr class="${i%2?'alt':''}"><td>${cols.map(c=>r[c]).join('</td><td>')}</td></tr>`).join('')
  const win = window.open('', '_blank', 'width=1100,height=750')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gate Entry Report</title>
  <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;margin:16px}
  h2{font-size:15px}table{width:100%;border-collapse:collapse}
  th{background:#0097A7;color:#fff;padding:5px 7px;text-align:left;font-size:10px}
  td{padding:4px 7px;border-bottom:1px solid #e2e8f0;font-size:10px}
  tr.alt td{background:#f8fafc}@media print{@page{margin:1cm}}</style></head>
  <body><h2>Gate Entry Report</h2>
  <table><thead><tr>${thead}</tr></thead><tbody>${tbody}</tbody></table>
  </body></html>`)
  win.document.close(); win.focus()
  setTimeout(() => win.print(), 400)
}

export default function GateEntryReport() {
  const [fromDate, setFromDate] = useState(thirtyDaysAgo)
  const [toDate, setToDate] = useState(today)
  const [allRows, setAllRows] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [activeRow, setActiveRow] = useState(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterText, setFilterText] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const settingsRef = useRef(null)

  const [viewEntry, setViewEntry] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const ALL_COLS = ['Gate Entry No', 'Gate No', 'Date', 'Invoice No', 'PO No', 'Supplier Name', 'Carrier Name', 'Vehicle No', 'Invoice Qty', 'Status']
  const [hiddenCols, setHiddenCols] = useState(new Set())
  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c))
  const colSpanTotal = visibleCols.length + 3 // View + Edit + Delete

  useEffect(() => {
    const handler = e => { if (settingsRef.current && !settingsRef.current.contains(e.target)) setSettingsOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${BASE}/api/gate-master`)
      const json = await res.json()
      if (json.success) { setAllRows(json.data); setRows(json.data) }
    } catch (err) { console.error('Error fetching gate entries:', err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      const result = allRows.filter(r => {
        const d = r.gateEntryDate ? r.gateEntryDate.split('T')[0] : ''
        return d >= fromDate && d <= toDate
      })
      setRows(result)
      setActiveRow(null)
      setFilterText('')
      setSearching(false)
    }, 0)
  }

  const toggleCol = col => setHiddenCols(prev => {
    const next = new Set(prev); next.has(col) ? next.delete(col) : next.add(col); return next
  })

  const displayRows = filterText.trim()
    ? rows.filter(r => {
        const q = filterText.toLowerCase()
        return (
          (r.gateEntryNo || '').toLowerCase().includes(q) ||
          (r.poNo || '').toLowerCase().includes(q) ||
          (r.supplierName || '').toLowerCase().includes(q) ||
          (r.invoiceNo || '').toLowerCase().includes(q) ||
          (r.status || '').toLowerCase().includes(q)
        )
      })
    : rows

  const totalQty = displayRows.reduce((sum, r) => {
    const qty = r.details?.reduce((s, d) => s + (d.recQty || 0), 0) || 0
    return sum + qty
  }, 0)

  const handleEdit = (entry, e) => {
    e.stopPropagation()
    localStorage.setItem('velson:gate-edit', String(entry.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'GateEntry' } }))
  }

  const headerDelete = () => {
    if (activeRow === null || !displayRows[activeRow]) return
    setDeleteTarget(displayRows[activeRow])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`${BASE}/api/gate-master/${deleteTarget.id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success !== false) {
        const filter = r => r.id !== deleteTarget.id
        setAllRows(prev => prev.filter(filter))
        setRows(prev => prev.filter(filter))
        setActiveRow(null)
      }
    } catch (err) { console.error('Delete error:', err) }
    finally { setDeleting(false); setDeleteTarget(null) }
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Gate Entry Report</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">Gate Entry Report</h2>
          <div className="flex gap-2">
            <button
              onClick={headerDelete}
              disabled={activeRow === null}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1 disabled:opacity-40"
            >
              <Trash2 className="w-3 h-3"/> Delete
            </button>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }))}
              className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3"/> Close
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className={lbl}>From Date :</label>
              <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className={inp}/>
            </div>
            <div className="flex items-center gap-2">
              <label className={lbl}>To Date :</label>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className={inp}/>
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || loading}
              className="flex items-center gap-1.5 px-3 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[12px] font-medium transition-colors shadow-sm disabled:opacity-70"
            >
              <span className="w-2 h-2 rounded-full bg-orange-500"></span>
              {searching ? 'Searching...' : 'Search Details'}
            </button>
            <button
              onClick={() => { setRows(allRows); setActiveRow(null); setFilterText('') }}
              className="flex items-center gap-1.5 px-3 py-1 border border-[#0097A7] text-[#0097A7] bg-white hover:bg-[#0097A7]/10 rounded text-[12px] font-medium transition-colors shadow-sm"
            >
              <span className="w-2 h-2 rounded-full bg-red-500"></span> Search Summary
            </button>
          </div>

          {/* Export Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-500">LS</span>
              <input value={displayRows.length} readOnly className="w-10 text-center border border-slate-300 rounded text-[12px] py-0.5 bg-slate-50"/>
            </div>
            <div className="h-4 w-px bg-slate-300"/>
            <button onClick={() => doDocExport(displayRows)} className={iconBtn}><FileText className="w-4 h-4 text-[#0097A7]"/> Dos</button>
            <button onClick={() => doExcelExport(displayRows)} className={iconBtn}><FileSpreadsheet className="w-4 h-4 text-[#0097A7]"/> Excel</button>
            <button onClick={() => doPrint(displayRows)} className={iconBtn}><FilePdf className="w-4 h-4 text-red-500"/> Pdf</button>
            <button
              onClick={() => { setFilterOpen(o => !o); if (filterOpen) setFilterText('') }}
              className={`${iconBtn} ${filterOpen ? 'text-[#0097A7]' : ''}`}
            >
              <Filter className={`w-4 h-4 ${filterOpen ? 'text-[#0097A7]' : 'text-blue-500'}`}/> Filter
            </button>
            <div className="relative" ref={settingsRef}>
              <button onClick={() => setSettingsOpen(o => !o)} className={`${iconBtn} ${settingsOpen ? 'text-[#0097A7]' : ''}`}>
                <Settings className="w-4 h-4 text-slate-700"/> Setting
              </button>
              {settingsOpen && (
                <div className="absolute right-0 top-7 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-3 min-w-[180px]">
                  <p className="text-[11px] font-bold text-slate-500 uppercase mb-2 tracking-wide">Show / Hide Columns</p>
                  {ALL_COLS.map(col => (
                    <label key={col} className="flex items-center gap-2 py-1 cursor-pointer hover:text-[#0097A7]">
                      <input type="checkbox" checked={!hiddenCols.has(col)} onChange={() => toggleCol(col)} className="accent-[#0097A7]"/>
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
            <Filter className="w-3.5 h-3.5 text-blue-400 shrink-0"/>
            <input autoFocus type="text" value={filterText} onChange={e => setFilterText(e.target.value)}
              placeholder="Search Gate Entry No, PO No, Supplier, Invoice No…"
              className="flex-1 border border-blue-200 rounded px-3 py-1 text-[12.5px] focus:outline-none focus:border-[#0097A7] bg-white"/>
            {filterText && (
              <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600">
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
            <span className="text-[11px] text-slate-400 shrink-0">{displayRows.length} result{displayRows.length !== 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Data Grid */}
        <div className="flex-1 overflow-auto relative">
          {loading ? (
            <div className="flex items-center justify-center h-32 gap-2.5 text-slate-500 text-[12px]">
              <Spinner cls="w-5 h-5 text-[#0097A7]"/> Loading…
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 text-[12px]">
                      {filterText ? 'No matching records' : 'No gate entries found'}
                    </td>
                  </tr>
                ) : displayRows.map((row, i) => {
                  const rowQty = row.details?.reduce((s, d) => s + (d.recQty || 0), 0) || 0
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setActiveRow(i)}
                      className={`cursor-pointer transition-colors ${activeRow === i ? 'bg-[#0097A7]/20' : 'hover:bg-slate-50'}`}
                    >
                      {visibleCols.map(col => {
                        switch (col) {
                          case 'Gate Entry No': return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{row.gateEntryNo}</td>
                          case 'Gate No':       return <td key={col} className="p-1.5 border-x border-slate-200 text-center">{row.gateNo || '—'}</td>
                          case 'Date':          return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(row.gateEntryDate)}</td>
                          case 'Invoice No':    return <td key={col} className="p-1.5 border-x border-slate-200">{row.invoiceNo || '—'}</td>
                          case 'PO No':         return <td key={col} className="p-1.5 border-x border-slate-200">{row.poNo || '—'}</td>
                          case 'Supplier Name': return <td key={col} className="p-1.5 border-x border-slate-200">{row.supplierName || '—'}</td>
                          case 'Carrier Name':  return <td key={col} className="p-1.5 border-x border-slate-200">{row.carrierName || '—'}</td>
                          case 'Vehicle No':    return <td key={col} className="p-1.5 border-x border-slate-200">{row.vehicleNo || '—'}</td>
                          case 'Invoice Qty':   return <td key={col} className="p-1.5 border-x border-slate-200 text-right">{rowQty.toFixed(2)}</td>
                          case 'Status':        return <td key={col} className="p-1.5 border-x border-slate-200">
                            <span className={`font-semibold ${row.status === 'Open' ? 'text-emerald-600' : 'text-slate-600'}`}>{row.status || '—'}</span>
                          </td>
                          default: return null
                        }
                      })}
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button onClick={e => { e.stopPropagation(); setViewEntry(row) }}
                          className="text-[#0097A7] hover:text-[#007a87] transition-colors" title="View">
                          <Eye className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button onClick={e => handleEdit(row, e)}
                          className="text-amber-500 hover:text-amber-600 transition-colors" title="Edit">
                          <Pencil className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                      <td className="p-1.5 border-x border-slate-200 text-center">
                        <button onClick={e => { e.stopPropagation(); setDeleteTarget(row) }}
                          className="text-red-500 hover:text-red-600 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-[#f4f6ce] font-semibold text-slate-800 border-t-2 border-slate-300">
                <tr>
                  <td colSpan={colSpanTotal - 1} className="p-2 border-x border-slate-300">
                    Row : {displayRows.length}{filterText ? ` (filtered from ${rows.length})` : ''}
                  </td>
                  <td className="p-2 border-x border-slate-300 text-right">{totalQty.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>

      {/* View Modal */}
      {viewEntry && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewEntry(null)}/>
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-[720px] max-h-[88vh] overflow-hidden flex flex-col">
            <div className="bg-[#0097A7] px-5 py-3 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-white font-semibold text-[14px]">Gate Entry Details</h3>
                <p className="text-white/70 text-[11px] mt-0.5">{viewEntry.gateEntryNo} &nbsp;·&nbsp; {viewEntry.status}</p>
              </div>
              <button onClick={() => setViewEntry(null)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-4 h-4"/>
              </button>
            </div>

            <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] shrink-0 border-b border-slate-100">
              {[
                ['Gate Entry No',    viewEntry.gateEntryNo],
                ['Gate Entry Date',  fmtDate(viewEntry.gateEntryDate)],
                ['PO No',            viewEntry.poNo],
                ['PRQ No',           viewEntry.prqNo],
                ['Supplier Name',    viewEntry.supplierName],
                ['Gate No',          viewEntry.gateNo],
                ['Carrier Name',     viewEntry.carrierName],
                ['Vehicle No',       viewEntry.vehicleNo],
                ['Invoice No',       viewEntry.invoiceNo],
                ['Invoice Date',     fmtDate(viewEntry.invoiceDate)],
                ['Status',           viewEntry.status],
                ['Remarks',          viewEntry.remarks],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-36 font-semibold text-slate-500 shrink-0">{label}</span>
                  <span className="text-slate-400 shrink-0">:</span>
                  <span className="text-slate-800">{value || '—'}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <p className="text-[12px] font-semibold text-slate-600 mb-2">Items</p>
              {viewEntry.details?.length > 0 ? (
                <table className="w-full text-[11.5px] border border-slate-200 rounded">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      {['#','PO No','Item Code','Item Name','Supplier Part No','Description','HSN','Unit','Qty','Rec Qty'].map(h => (
                        <th key={h} className="px-2 py-1 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewEntry.details.map((it, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                        <td className="px-2 py-1">{idx+1}</td>
                        <td className="px-2 py-1">{it.poNo || '—'}</td>
                        <td className="px-2 py-1">{it.itemCode || '—'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{it.itemName || '—'}</td>
                        <td className="px-2 py-1">{it.supplierPartNo || '—'}</td>
                        <td className="px-2 py-1">{it.description || '—'}</td>
                        <td className="px-2 py-1">{it.hsnCode || '—'}</td>
                        <td className="px-2 py-1">{it.unit || '—'}</td>
                        <td className="px-2 py-1 text-right">{it.qty ?? '—'}</td>
                        <td className="px-2 py-1 text-right font-medium">{it.recQty ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[12px] text-slate-400 italic">No items</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11.5px] text-slate-400">{viewEntry.details?.length || 0} item(s)</span>
              <button onClick={() => setViewEntry(null)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-200 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        message={`Delete gate entry ${deleteTarget?.gateEntryNo}? This action cannot be undone.`}
        onCancel={() => { if (!deleting) setDeleteTarget(null) }}
        onConfirm={handleDeleteConfirm}
        confirming={deleting}
      />
    </div>
  )
}
