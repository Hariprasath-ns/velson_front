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
  return records.filter(po => {
    const d = new Date(po.poDate)
    if (f && d < f) return false
    if (t && d > t) return false
    return true
  })
}

const ALL_COLS = [
  'PO No', 'PO Date', 'PO Type', 'Supplier Name', 'Contact Person',
  'ETA Date', 'Status', 'Total Amount',
]

const buildRows = (data) =>
  data.map(po => ({
    'PO No':          po.poNo || '',
    'PO Date':        fmtDate(po.poDate),
    'PO Type':        po.poType || '',
    'Supplier Name':  po.supplier?.supplierName || '',
    'Contact Person': po.contactPerson || '',
    'ETA Date':       fmtDate(po.etaDate),
    'Status':         po.status || '',
    'Total Amount':   po.totalAmount != null ? Number(po.totalAmount).toFixed(2) : '0.00',
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

const doPrintList = (data, from, to) => {
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

const doPrintSingle = (po) => {
  const win = window.open('', '_blank', 'width=900,height=750')
  const items = (po.details || []).map((d, i) =>
    `<tr class="${i%2?'alt':''}">
      <td>${i+1}</td><td>${d.itemCode||'-'}</td><td>${d.itemName||'-'}</td>
      <td>${d.description||'-'}</td><td>${d.hsnCode||'-'}</td>
      <td>${d.uom||'-'}</td><td>${d.qty||0}</td><td>${Number(d.unitPrice||0).toFixed(2)}</td>
      <td>${Number(d.discPer||0).toFixed(2)}</td><td>${Number(d.amount||0).toFixed(2)}</td>
      <td>${Number(d.gstPer||0).toFixed(2)}</td><td>${Number(d.gstAmt||0).toFixed(2)}</td>
      <td>${Number(d.netAmt||0).toFixed(2)}</td>
    </tr>`
  ).join('')
  win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>PO - ${po.poNo}</title>
<style>
  *{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#222}
  .header{display:flex;justify-content:space-between;margin-bottom:12px;border-bottom:2px solid #0097A7;padding-bottom:8px}
  .company{font-size:16px;font-weight:bold;color:#0097A7}.sub{font-size:11px;color:#555}
  h3{font-size:13px;margin:0 0 2px}
  .info{display:grid;grid-template-columns:1fr 1fr;gap:4px 16px;margin-bottom:10px}
  .info-row{display:flex;gap:6px;font-size:11px}
  .info-row span:first-child{font-weight:600;width:130px;color:#555;flex-shrink:0}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th{background:#0097A7;color:#fff;padding:4px 6px;font-size:10px;text-align:left;white-space:nowrap}
  td{padding:3px 6px;border-bottom:1px solid #e2e8f0;font-size:10px}
  tr.alt td{background:#f8fafc}
  .totals{display:flex;justify-content:flex-end;margin-top:8px}
  .totals-box{width:280px}
  .tot-row{display:flex;justify-content:space-between;font-size:11px;padding:2px 0}
  .grand{font-weight:bold;font-size:13px;color:#0097A7;border-top:1px solid #ccc;padding-top:4px;margin-top:4px}
  @media print{@page{margin:1cm}button{display:none}}
</style></head><body>
<div class="header">
  <div><div class="company">PURCHASE ORDER</div><div class="sub">PO No: <strong>${po.poNo}</strong> &nbsp;|&nbsp; Date: ${fmtDate(po.poDate)}</div></div>
  <div style="text-align:right;font-size:11px;color:#555">Status: <strong>${po.status||''}</strong><br>ETA: ${fmtDate(po.etaDate)}</div>
</div>
<div class="info">
  <div class="info-row"><span>Supplier</span><span>: ${po.supplier?.supplierName||'-'}</span></div>
  <div class="info-row"><span>PO Type</span><span>: ${po.poType||'-'}</span></div>
  <div class="info-row"><span>Address</span><span>: ${po.supplierAddress||'-'}</span></div>
  <div class="info-row"><span>Contact Person</span><span>: ${po.contactPerson||'-'}</span></div>
  <div class="info-row"><span>GST No</span><span>: ${po.gstNo||'-'}</span></div>
  <div class="info-row"><span>Payment Terms</span><span>: ${po.paymentTerms||'-'}</span></div>
  <div class="info-row"><span>Freight</span><span>: ${po.freight||'-'}</span></div>
  <div class="info-row"><span>Delivery Period</span><span>: ${po.deliveryPeriod||'-'}</span></div>
  <div class="info-row"><span>Remarks</span><span>: ${po.remarks||'-'}</span></div>
</div>
<table>
  <thead><tr><th>#</th><th>Item Code</th><th>Item Name</th><th>Description</th><th>HSN</th><th>UOM</th><th>Qty</th><th>Unit Price</th><th>Disc%</th><th>Amount</th><th>GST%</th><th>GST Amt</th><th>Net Amt</th></tr></thead>
  <tbody>${items||'<tr><td colspan="13" style="text-align:center;padding:10px">No items</td></tr>'}</tbody>
</table>
<div class="totals"><div class="totals-box">
  <div class="tot-row"><span>Sub Total</span><span>${Number(po.subTotal||0).toFixed(2)}</span></div>
  ${po.cgstAmt > 0 ? `<div class="tot-row"><span>CGST (${po.cgstPer}%)</span><span>${Number(po.cgstAmt).toFixed(2)}</span></div>` : ''}
  ${po.sgstAmt > 0 ? `<div class="tot-row"><span>SGST (${po.sgstPer}%)</span><span>${Number(po.sgstAmt).toFixed(2)}</span></div>` : ''}
  ${po.igstAmt > 0 ? `<div class="tot-row"><span>IGST (${po.igstPer}%)</span><span>${Number(po.igstAmt).toFixed(2)}</span></div>` : ''}
  ${po.othersAmt > 0 ? `<div class="tot-row"><span>Others (${po.othersPer}%)</span><span>${Number(po.othersAmt).toFixed(2)}</span></div>` : ''}
  <div class="tot-row grand"><span>Grand Total</span><span>${Number(po.totalAmount||0).toFixed(2)}</span></div>
</div></div>
</body></html>`)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print() }, 400)
}

export default function PrintPurchaseOrder() {
  const [fromDate, setFromDate]   = useState('2026-04-01')
  const [toDate, setToDate]       = useState(new Date().toISOString().split('T')[0])
  const [activeRow, setActiveRow] = useState(null)
  const [allData, setAllData]     = useState([])
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(false)

  const [viewPO, setViewPO]               = useState(null)
  const [deleteTarget, setDeleteTarget]   = useState(null)
  const [deleting, setDeleting]           = useState(false)

  const [filterOpen, setFilterOpen]   = useState(false)
  const [filterText, setFilterText]   = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [hiddenCols, setHiddenCols]   = useState(new Set())
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
        const res  = await fetch('http://localhost:3000/api/purchase-master')
        const json = await res.json()
        if (json.success && json.data) {
          setAllData(json.data)
          setData(applyFilter(json.data, fromDate, toDate))
        }
      } catch (err) {
        console.error('Error fetching purchase orders:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = () => {
    setData(applyFilter(allData, fromDate, toDate))
    setActiveRow(null)
    setFilterText('')
  }

  const displayData = filterText.trim()
    ? data.filter(po => {
        const q = filterText.toLowerCase()
        return (
          (po.poNo || '').toLowerCase().includes(q) ||
          (po.poType || '').toLowerCase().includes(q) ||
          (po.supplier?.supplierName || '').toLowerCase().includes(q) ||
          (po.status || '').toLowerCase().includes(q) ||
          (po.contactPerson || '').toLowerCase().includes(q)
        )
      })
    : data

  const toggleCol = col =>
    setHiddenCols(prev => {
      const next = new Set(prev)
      next.has(col) ? next.delete(col) : next.add(col)
      return next
    })
  const visibleCols = ALL_COLS.filter(c => !hiddenCols.has(c))

  const handleExcel = () => doExcelExport(displayData, fromDate, toDate)
  const handleDoc   = () => doDocExport(displayData, fromDate, toDate)
  const handlePrint = () => doPrintList(displayData, fromDate, toDate)

  const handleClose = () =>
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'Dashboard' } }))

  const handleHeaderDelete = () => {
    if (activeRow === null || !displayData[activeRow]) return
    setDeleteTarget(displayData[activeRow])
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`http://localhost:3000/api/purchase-master/${deleteTarget.id}`, { method: 'DELETE' })
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

  const handleEdit = (po, e) => {
    e.stopPropagation()
    localStorage.setItem('velson:po-edit', String(po.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderEntry' } }))
  }

  const renderCell = (po, col) => {
    switch (col) {
      case 'PO No':         return <td key={col} className="p-1.5 border-x border-slate-200 font-medium text-[#0097A7]">{po.poNo}</td>
      case 'PO Date':       return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(po.poDate)}</td>
      case 'PO Type':       return <td key={col} className="p-1.5 border-x border-slate-200">{po.poType || ''}</td>
      case 'Supplier Name': return <td key={col} className="p-1.5 border-x border-slate-200">{po.supplier?.supplierName || ''}</td>
      case 'Contact Person':return <td key={col} className="p-1.5 border-x border-slate-200">{po.contactPerson || ''}</td>
      case 'ETA Date':      return <td key={col} className="p-1.5 border-x border-slate-200">{fmtDate(po.etaDate)}</td>
      case 'Status':        return (
        <td key={col} className="p-1.5 border-x border-slate-200">
          <span className={`font-medium ${po.status === 'Approval' ? 'text-green-600' : po.status === 'Rejected' ? 'text-red-500' : 'text-amber-600'}`}>
            {po.status}
          </span>
        </td>
      )
      case 'Total Amount':  return <td key={col} className="p-1.5 border-x border-slate-200 text-right font-medium">{Number(po.totalAmount||0).toFixed(2)}</td>
      default: return null
    }
  }

  const colSpanTotal = visibleCols.length + 3

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden h-screen flex flex-col">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400 shrink-0">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Purchase</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Print Purchase Order</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between shrink-0">
          <h2 className="text-white font-semibold text-[14px]">Print Purchase Order</h2>
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
              <Printer className="w-3 h-3" /> Print Purchase Order
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
            >
              <Filter className={`w-4 h-4 ${filterOpen ? 'text-[#0097A7]' : 'text-blue-500'}`} /> Filter
            </button>
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(o => !o)}
                className={`${iconBtn} ${settingsOpen ? 'text-[#0097A7]' : ''}`}
              >
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
                  <th className="p-2 font-medium border-x border-slate-700 text-center">View</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Edit</th>
                  <th className="p-2 font-medium border-x border-slate-700 text-center">Delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {displayData.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanTotal} className="p-8 text-center text-slate-400 text-[12px]">
                      {filterText ? 'No matching records' : 'No purchase orders found'}
                    </td>
                  </tr>
                ) : displayData.map((po, i) => (
                  <tr
                    key={po.id}
                    onClick={() => setActiveRow(i)}
                    className={`cursor-pointer transition-colors ${activeRow === i ? 'bg-[#0097A7]/20' : 'hover:bg-slate-50'}`}
                  >
                    {visibleCols.map(col => renderCell(po, col))}
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setViewPO(po) }}
                        className="text-[#0097A7] hover:text-[#007a87] transition-colors"
                        title="View details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button
                        onClick={e => handleEdit(po, e)}
                        className="text-amber-500 hover:text-amber-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="p-1.5 border-x border-slate-200 text-center">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteTarget(po) }}
                        className="text-red-500 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
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

      {/* View Modal */}
      {viewPO && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setViewPO(null)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 w-[720px] max-h-[88vh] overflow-hidden flex flex-col">
            <div className="px-5 py-3 flex items-center justify-between shrink-0 bg-[#0097A7]">
              <div>
                <h3 className="text-white font-semibold text-[14px]">Purchase Order Details</h3>
                <p className="text-white/70 text-[11px] mt-0.5">{viewPO.poNo} &nbsp;·&nbsp; {viewPO.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => doPrintSingle(viewPO)}
                  className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => setViewPO(null)} className="text-white/80 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-5 pt-4 pb-3 grid grid-cols-2 gap-x-6 gap-y-2 text-[12.5px] shrink-0 border-b border-slate-100">
              {[
                ['PO Number',     viewPO.poNo],
                ['PO Date',       fmtDate(viewPO.poDate)],
                ['PO Type',       viewPO.poType],
                ['ETA Date',      fmtDate(viewPO.etaDate)],
                ['Supplier',      viewPO.supplier?.supplierName],
                ['Contact Person',viewPO.contactPerson],
                ['GST No',        viewPO.gstNo],
                ['Status',        viewPO.status],
                ['Payment Terms', viewPO.paymentTerms],
                ['Freight',       viewPO.freight],
                ['Delivery Period',viewPO.deliveryPeriod],
                ['Remarks',       viewPO.remarks],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <span className="w-32 font-semibold text-slate-500 shrink-0">{label}</span>
                  <span className="text-slate-400 shrink-0">:</span>
                  <span className="text-slate-800">{value || '-'}</span>
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              <p className="text-[12px] font-semibold text-slate-600 mb-2">Items</p>
              {viewPO.details?.length > 0 ? (
                <table className="w-full text-[11.5px] border border-slate-200 rounded">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr>
                      {['#','Item Code','Item Name','Description','HSN','UOM','Qty','Unit Price','Disc%','Amount','GST%','GST Amt','Net Amt'].map(h => (
                        <th key={h} className="px-2 py-1 text-left font-semibold text-slate-600 border-b border-slate-200 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {viewPO.details.map((d, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                        <td className="px-2 py-1">{idx+1}</td>
                        <td className="px-2 py-1">{d.itemCode||'-'}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{d.itemName||'-'}</td>
                        <td className="px-2 py-1">{d.description||'-'}</td>
                        <td className="px-2 py-1">{d.hsnCode||'-'}</td>
                        <td className="px-2 py-1">{d.uom||'-'}</td>
                        <td className="px-2 py-1 text-right">{d.qty||0}</td>
                        <td className="px-2 py-1 text-right">{Number(d.unitPrice||0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{Number(d.discPer||0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{Number(d.amount||0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{Number(d.gstPer||0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right">{Number(d.gstAmt||0).toFixed(2)}</td>
                        <td className="px-2 py-1 text-right font-medium">{Number(d.netAmt||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-[12px] text-slate-400 italic">No items</p>
              )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between shrink-0 bg-slate-50">
              <div className="flex gap-6 text-[12px]">
                <span><span className="font-semibold text-slate-500">Sub Total:</span> <span className="font-medium">{Number(viewPO.subTotal||0).toFixed(2)}</span></span>
                {viewPO.cgstAmt > 0 && <span><span className="font-semibold text-slate-500">CGST:</span> {Number(viewPO.cgstAmt).toFixed(2)}</span>}
                {viewPO.sgstAmt > 0 && <span><span className="font-semibold text-slate-500">SGST:</span> {Number(viewPO.sgstAmt).toFixed(2)}</span>}
                {viewPO.igstAmt > 0 && <span><span className="font-semibold text-slate-500">IGST:</span> {Number(viewPO.igstAmt).toFixed(2)}</span>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[13px] font-bold text-[#0097A7]">Grand Total: {Number(viewPO.totalAmount||0).toFixed(2)}</span>
                <button onClick={() => setViewPO(null)} className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg border border-slate-200 transition-colors">
                  Close
                </button>
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
