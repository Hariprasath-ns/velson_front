import { useState, useEffect } from 'react'
import api from '../services/api'
import { X, Save, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/LocalLoader'

const PAGE_SIZES = [8, 25, 50, 100]

function pct(v) { return Number(v).toFixed(2) + '%' }

const emptyForm = {
  taxLedgerId:     '',
  taxPercent:      '',
  cgstTax:         '',
  sgstTax:         '',
  igstTax:         '',
  purchaseCgstTax: '',
  purchaseSgstTax: '',
  purchaseIgstTax: '',
  salesCgstTax:    '',
  salesSgstTax:    '',
  salesIgstTax:    '',
}

function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Tax Master Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-2">
          {[
            ['Tax Ledger A/C',       row.taxLedger?.ledgerName ?? '-'],
            ['Tax Percent',          pct(row.taxPercent)],
            ['CGST Tax %',           pct(row.cgstTax)],
            ['SGST Tax %',           pct(row.sgstTax)],
            ['IGST Tax %',           pct(row.igstTax)],
            ['Purchase CGST Tax %',  pct(row.purchaseCgstTax)],
            ['Purchase SGST Tax %',  pct(row.purchaseSgstTax)],
            ['Purchase IGST Tax %',  pct(row.purchaseIgstTax)],
            ['Sales CGST Tax %',     pct(row.salesCgstTax)],
            ['Sales SGST Tax %',     pct(row.salesSgstTax)],
            ['Sales IGST Tax %',     pct(row.salesIgstTax)],
          ].map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{lbl}</span>
              <span className="text-[13px] text-slate-800 font-medium">{val}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

export default function TaxMaster({ onNavigate }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [ledgers, setLedgers] = useState([])
  const [formData, setFormData] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [loading, setLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const fetchAll = async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/tax-master')
      if (res.data.success) setRows(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tax masters')
    } finally {
      setTableLoading(false)
    }
  }

  const fetchLedgers = async () => {
    try {
      const res = await api.get('/api/tax-ledger')
      if (res.data.success) setLedgers(res.data.data)
    } catch (err) {
      toast.error('Failed to load tax ledgers')
    }
  }

  useEffect(() => {
    fetchAll()
    fetchLedgers()
  }, [])

  const setField = (k, v) => {
    setFormData(f => {
      const next = { ...f, [k]: v }
      if (k === 'taxPercent') {
        const half = (Number(v) / 2).toFixed(2)
        next.cgstTax = half
        next.sgstTax = half
        next.igstTax = v
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (!formData.taxLedgerId) return toast.warning('Tax Ledger A/C is required')

    const payload = {
      taxLedgerId:     Number(formData.taxLedgerId),
      taxPercent:      parseFloat(formData.taxPercent      || 0),
      cgstTax:         parseFloat(formData.cgstTax         || 0),
      sgstTax:         parseFloat(formData.sgstTax         || 0),
      igstTax:         parseFloat(formData.igstTax         || 0),
      purchaseCgstTax: parseFloat(formData.purchaseCgstTax || 0),
      purchaseSgstTax: parseFloat(formData.purchaseSgstTax || 0),
      purchaseIgstTax: parseFloat(formData.purchaseIgstTax || 0),
      salesCgstTax:    parseFloat(formData.salesCgstTax    || 0),
      salesSgstTax:    parseFloat(formData.salesSgstTax    || 0),
      salesIgstTax:    parseFloat(formData.salesIgstTax    || 0),
    }

    setLoading(true)
    try {
      if (editId !== null) {
        await api.put(`/api/tax-master/${editId}`, payload)
        toast.success('Updated successfully')
      } else {
        await api.post('/api/tax-master', payload)
        toast.success('Created successfully')
      }
      setFormData(emptyForm)
      setEditId(null)
      setPage(1)
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (row) => {
    setFormData({
      taxLedgerId:     String(row.taxLedgerId),
      taxPercent:      String(row.taxPercent),
      cgstTax:         String(row.cgstTax),
      sgstTax:         String(row.sgstTax),
      igstTax:         String(row.igstTax),
      purchaseCgstTax: String(row.purchaseCgstTax),
      purchaseSgstTax: String(row.purchaseSgstTax),
      purchaseIgstTax: String(row.purchaseIgstTax),
      salesCgstTax:    String(row.salesCgstTax),
      salesSgstTax:    String(row.salesSgstTax),
      salesIgstTax:    String(row.salesIgstTax),
    })
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    setDeleteId(id)
    try {
      await api.delete(`/api/tax-master/${id}`)
      toast.success('Deleted successfully')
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleCancel = () => {
    setFormData(emptyForm)
    setEditId(null)
  }

  const filtered = rows.filter(r =>
    [r.taxLedger?.ledgerName, r.taxPercent, r.cgstTax, r.sgstTax, r.igstTax]
      .some(v => String(v ?? '').toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const inputCls = "w-full border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white"
  const labelCls = "block text-[12px] font-semibold text-slate-600 mb-0.5"

  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Tax Master</span>
      </div>

      {/* Form */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Tax Master' : 'Create - Tax Master'}
          </h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Tax Ledger dropdown */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0">
              <span className="text-red-500">*</span> Tax Ledger A/C :
            </label>
            <select
              value={formData.taxLedgerId}
              onChange={e => setField('taxLedgerId', e.target.value)}
              className="flex-1 border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white">
              <option value="">-- Select --</option>
              {ledgers.map(item => (
                <option key={item.id} value={item.id}>{item.ledgerName}</option>
              ))}
            </select>
            <button
              onClick={() => onNavigate && onNavigate('TaxLedger')}
              className="px-3 py-1 text-[12px] font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded transition-colors whitespace-nowrap">
              Add New Tax Ledger A/C
            </button>
          </div>

          {/* Tax % */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0 mb-0">Tax % :</label>
            <input type="number" value={formData.taxPercent} onChange={e => setField('taxPercent', e.target.value)}
              className="w-48 border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
              placeholder="0" min="0" step="0.01" />
          </div>

          {/* CGST / SGST / IGST */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0 mb-0">CGST Tax % :</label>
            <input type="number" value={formData.cgstTax} onChange={e => setField('cgstTax', e.target.value)}
              className="w-48 border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0 mb-0">SGST Tax % :</label>
            <input type="number" value={formData.sgstTax} onChange={e => setField('sgstTax', e.target.value)}
              className="w-48 border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]" />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0 mb-0">IGST Tax % :</label>
            <input type="number" value={formData.igstTax} onChange={e => setField('igstTax', e.target.value)}
              className="w-48 border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]" />
          </div>

          {/* Purchase taxes */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Purchase CGST Tax % :</label>
              <input type="number" value={formData.purchaseCgstTax} onChange={e => setField('purchaseCgstTax', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Purchase SGST Tax % :</label>
              <input type="number" value={formData.purchaseSgstTax} onChange={e => setField('purchaseSgstTax', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Purchase IGST Tax % :</label>
              <input type="number" value={formData.purchaseIgstTax} onChange={e => setField('purchaseIgstTax', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Sales taxes */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelCls}>Sales CGST Tax % :</label>
              <input type="number" value={formData.salesCgstTax} onChange={e => setField('salesCgstTax', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sales SGST Tax % :</label>
              <input type="number" value={formData.salesSgstTax} onChange={e => setField('salesSgstTax', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Sales IGST Tax % :</label>
              <input type="number" value={formData.salesIgstTax} onChange={e => setField('salesIgstTax', e.target.value)} className={inputCls} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSubmit} disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] disabled:opacity-50 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? (editId !== null ? 'Updating...' : 'Creating...') : (editId !== null ? 'Update' : 'Create')}
            </button>
            {editId !== null && (
              <button onClick={handleCancel}
                className="px-4 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold rounded transition-colors">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Tax Master Details</h2>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Search:
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40" />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]">
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>

        {tableLoading ? (
          <TableSkeleton rows={5} cols={['22%', '10%', '10%', '10%', '10%', '9%', '9%', '10%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Tax Ledger', 'Tax %', 'CGST %', 'SGST %', 'IGST %', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-slate-400 text-[13px]">No records found</td></tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-3 py-2.5 text-center">{row.taxLedger?.ledgerName ?? '-'}</td>
                  <td className="px-3 py-2.5 text-center">{pct(row.taxPercent)}</td>
                  <td className="px-3 py-2.5 text-center">{pct(row.cgstTax)}</td>
                  <td className="px-3 py-2.5 text-center">{pct(row.sgstTax)}</td>
                  <td className="px-3 py-2.5 text-center">{pct(row.igstTax)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleDelete(row.id)}
                      disabled={deleteId === row.id}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-[12px] font-semibold rounded transition-colors">
                      {deleteId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setDetailRow(row)}
                      className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors">
                      <Info className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button key={n} onClick={() => setPage(n)}
                className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
