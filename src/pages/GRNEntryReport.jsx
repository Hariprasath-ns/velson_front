import { useState, useEffect } from 'react'
import api from '../services/api'
import { ChevronRight, Search, Edit, Trash2, Printer, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/LocalLoader'

const today = new Date().toISOString().split('T')[0]
const ago30 = new Date(Date.now()-30*24*60*60*1000).toISOString().split('T')[0]

const PAGE_SIZES = [5,10,25,50]
const statusColor = s => ({ Completed:'bg-green-100 text-green-700', Pending:'bg-amber-100 text-amber-700', 'QC Pending':'bg-blue-100 text-blue-700', Open:'bg-green-100 text-green-700' }[s]??'bg-slate-100 text-slate-600')
const inp = 'border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] bg-white'

const fmtDate = (d) => {
  if (!d) return '-'
  const dt = new Date(d)
  if (isNaN(dt)) return d
  return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}`
}

const fmtAmt = (v) => {
  const n = parseFloat(v)
  if (isNaN(n)) return '-'
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function GRNEntryReport() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(ago30)
  const [toDate, setToDate] = useState(today)
  const [searchText, setSearchText] = useState('')
  const [allRows, setAllRows] = useState([])
  const [filtered, setFiltered] = useState([])
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)
  const [printingId, setPrintingId] = useState(null)

  const applyFilter = (rows, from, to, search) => {
    let r = rows
    if (from) r = r.filter(x => x.grnDate && new Date(x.grnDate) >= new Date(from))
    if (to)   r = r.filter(x => x.grnDate && new Date(x.grnDate) <= new Date(to + 'T23:59:59'))
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(x =>
        (x.grnNo||'').toLowerCase().includes(q) ||
        (x.supplierName||'').toLowerCase().includes(q) ||
        (x.poNo||'').toLowerCase().includes(q) ||
        (x.invoiceNo||'').toLowerCase().includes(q)
      )
    }
    return r
  }

  useEffect(() => {
    setLoading(true)
    api.get('/api/grn-master')
      .then(res => {
        const data = res.data.data || []
        setAllRows(data)
        setFiltered(applyFilter(data, ago30, today, ''))
      })
      .catch(() => toast.error('Failed to load GRN entries'))
      .finally(() => setLoading(false))
  }, [])

  const handleSearch = () => {
    setFiltered(applyFilter(allRows, fromDate, toDate, searchText))
    setPage(1)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this GRN entry?')) return
    setDeletingId(id)
    try {
      await api.delete(`/api/grn-master/${id}`)
      const updated = allRows.filter(r => r.id !== id)
      setAllRows(updated)
      setFiltered(f => f.filter(r => r.id !== id))
      toast.success('GRN entry deleted')
    } catch {
      toast.error('Failed to delete GRN entry')
    } finally {
      setDeletingId(null)
    }
  }

  const handleEdit = (row) => {
    window.__velsonNav = { editId: row.id }
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'GRNEntry' } }))
  }

  const handlePrint = async (row) => {
    setPrintingId(row.id)
    let grn = row
    try {
      const res = await api.get(`/api/grn-master/${row.id}`, { skipGlobalLoader: true })
      if (res.data.data) grn = res.data.data
    } catch { /* use cached row data */ }
    finally { setPrintingId(null) }

    const fmtD = (d) => { if (!d) return '-'; const dt = new Date(d); if (isNaN(dt)) return d; return `${String(dt.getDate()).padStart(2,'0')}/${String(dt.getMonth()+1).padStart(2,'0')}/${dt.getFullYear()}` }
    const fmtN = (v) => { const n = parseFloat(v); return isNaN(n) ? '-' : n.toFixed(2) }
    const details = grn.details || []
    const itemRows = details.map((d, i) => `
      <tr class="${i%2?'alt':''}">
        <td>${i+1}</td><td>${d.itemCode||''}</td><td style="text-align:left">${d.itemName||''}</td>
        <td>${d.hsnCode||''}</td><td>${d.unit||''}</td><td>${fmtN(d.qty)}</td>
        <td>${fmtN(d.unitPrice)}</td><td>${fmtN(d.discPer)}</td>
        <td>${fmtN(d.finalPrice)}</td><td>${fmtN(d.taxPer)}</td><td>${fmtN(d.netAmt)}</td>
      </tr>`).join('')
    const win = window.open('', '_blank', 'width=1050,height=780')
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>GRN - ${grn.grnNo}</title>
    <style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:11px;margin:20px;color:#222}
    h2{text-align:center;font-size:15px;margin-bottom:4px}
    .sub{text-align:center;font-size:11px;color:#555;margin-bottom:12px}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:4px 20px;margin-bottom:12px;border:1px solid #ccc;padding:8px;border-radius:4px}
    .info-row{display:flex;gap:6px}.info-lbl{font-weight:bold;width:130px;flex-shrink:0}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#0097A7;color:#fff;padding:5px 6px;text-align:center;font-size:10px}
    td{padding:3px 6px;border-bottom:1px solid #e2e8f0;font-size:10px;text-align:center}
    tr.alt td{background:#f8fafc}
    .totals{margin-top:8px;text-align:right;font-size:11px}
    .totals span{font-weight:bold}
    @media print{@page{margin:1cm}}</style></head>
    <body>
    <h2>GOODS RECEIPT NOTE</h2>
    <div class="sub">${grn.grnNo} &nbsp;|&nbsp; Date: ${fmtD(grn.grnDate)}</div>
    <div class="info">
      <div class="info-row"><span class="info-lbl">Supplier:</span>${grn.supplierName||'-'}</div>
      <div class="info-row"><span class="info-lbl">GRN Type:</span>${grn.grnType||'-'}</div>
      <div class="info-row"><span class="info-lbl">PO No:</span>${grn.poNo||'-'}</div>
      <div class="info-row"><span class="info-lbl">PO Date:</span>${fmtD(grn.poDate)}</div>
      <div class="info-row"><span class="info-lbl">Gate Entry No:</span>${grn.gateEntryNo||'-'}</div>
      <div class="info-row"><span class="info-lbl">Invoice No:</span>${grn.invoiceNo||'-'}</div>
      <div class="info-row"><span class="info-lbl">Invoice Date:</span>${fmtD(grn.invoiceDate)}</div>
      <div class="info-row"><span class="info-lbl">Tax Type:</span>${grn.taxType||'-'}</div>
      <div class="info-row"><span class="info-lbl">QC Type:</span>${grn.qcType||'-'}</div>
      <div class="info-row"><span class="info-lbl">Status:</span>${grn.status||'-'}</div>
    </div>
    <table>
      <thead><tr><th>#</th><th>Item Code</th><th>Item Name</th><th>HSN</th><th>Unit</th><th>Qty</th><th>Unit Price</th><th>Disc %</th><th>Final Price</th><th>Tax %</th><th>Net Amt</th></tr></thead>
      <tbody>${itemRows||'<tr><td colspan="11">No items</td></tr>'}</tbody>
    </table>
    <div class="totals">
      Sub Total: <span>${fmtN(grn.subTotal)}</span> &nbsp;&nbsp;
      Total Amount: <span>${fmtN(grn.totalAmount)}</span>
    </div>
    ${grn.remarks ? `<div style="margin-top:8px;font-size:11px"><b>Remarks:</b> ${grn.remarks}</div>` : ''}
    </body></html>`)
    win.document.close(); win.focus()
    setTimeout(() => win.print(), 400)
  }

  const taxableAmt = (row) => (row.details||[]).reduce((s,d) => s + (d.finalPrice||0), 0)
  const taxAmt = (row) => (row.details||[]).reduce((s,d) => s + ((d.netAmt||0) - (d.finalPrice||0)), 0)

  const totalPages = Math.max(1, Math.ceil(filtered.length/pageSize))
  const paged = filtered.slice((page-1)*pageSize, page*pageSize)
  const cols = ['GRN No','GRN Date','Gate Entry No','Supplier Name','PO No','Invoice No','Invoice Date','GRN Type','Taxable Amt','Tax Amt','Freight Tax Amt','TCS %','TCS Amt','Total Amount','Status','Edit','Delete','Print']

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">GRN Entry Report</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white font-semibold text-[14px]">GRN Entry Report</h2>
        </div>

        <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5">
            <label className="text-[12px] font-semibold text-slate-600">From Date:</label>
            <input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)} className={inp}/>
          </div>
          <div className="flex items-center gap-1.5">
            <label className="text-[12px] font-semibold text-slate-600">To Date:</label>
            <input type="date" value={toDate} onChange={e=>setToDate(e.target.value)} className={inp}/>
          </div>
          <button onClick={handleSearch} disabled={loading} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12.5px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Search className="w-3.5 h-3.5"/>} Search
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[12.5px] text-slate-600">Show <select value={pageSize} onChange={e=>{setPageSize(Number(e.target.value));setPage(1)}} className={`${inp} w-16`}>{PAGE_SIZES.map(s=><option key={s}>{s}</option>)}</select> entries</div>
          <div className="flex items-center gap-2"><label className="text-[12px] text-slate-600">Search:</label><input value={searchText} onChange={e=>setSearchText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} className={`${inp} w-40`}/></div>
        </div>

        {loading ? (
          <TableSkeleton rows={5} cols={['6%','7%','6%','12%','8%','7%','7%','7%','7%','7%','5%','5%','5%','7%','6%','4%','4%','4%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[12.5px]">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{cols.map(h=><th key={h} className="px-3 py-2 text-center font-bold text-slate-600 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {paged.length===0 ? (
                <tr><td colSpan={18} className="text-center py-12 text-slate-400 text-[13px]">No GRN entries found.</td></tr>
              ) : paged.map((row,idx)=>(
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx%2===1?'bg-slate-50/50':''}`}>
                  <td className="px-3 py-2 text-center font-medium text-[#0097A7]">{row.grnNo}</td>
                  <td className="px-3 py-2 text-center">{fmtDate(row.grnDate)}</td>
                  <td className="px-3 py-2 text-center">{row.gateEntryNo||'-'}</td>
                  <td className="px-3 py-2 text-center font-medium">{row.supplierName||'-'}</td>
                  <td className="px-3 py-2 text-center">{row.poNo||'—'}</td>
                  <td className="px-3 py-2 text-center">{row.invoiceNo||'-'}</td>
                  <td className="px-3 py-2 text-center">{fmtDate(row.invoiceDate)}</td>
                  <td className="px-3 py-2 text-center">{row.grnType||'-'}</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-700">{fmtAmt(taxableAmt(row))}</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-700">{fmtAmt(taxAmt(row))}</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center">-</td>
                  <td className="px-3 py-2 text-center font-semibold text-slate-700">{fmtAmt(row.totalAmount)}</td>
                  <td className="px-3 py-2 text-center"><span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusColor(row.status)}`}>{row.status}</span></td>
                  <td className="px-3 py-2 text-center"><button onClick={()=>handleEdit(row)} className="px-2 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] rounded transition-colors"><Edit className="w-3.5 h-3.5"/></button></td>
                  <td className="px-3 py-2 text-center">
                    <button
                      onClick={()=>handleDelete(row.id)}
                      disabled={deletingId===row.id}
                      className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors disabled:opacity-60"
                    >
                      {deletingId===row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Trash2 className="w-3.5 h-3.5"/>}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center"><button onClick={()=>handlePrint(row)} disabled={printingId===row.id} className="px-2 py-1 bg-purple-500 hover:bg-purple-600 text-white text-[11px] rounded transition-colors disabled:opacity-60">{printingId===row.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Printer className="w-3.5 h-3.5"/>}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">Showing {filtered.length===0?0:(page-1)*pageSize+1} to {Math.min(page*pageSize,filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>
    </div>
  )
}
