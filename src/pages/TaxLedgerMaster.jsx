import { useState, useEffect } from 'react'
import api from '../services/api'
import { X, Save, Edit, Trash2, Info, ChevronRight, ArrowLeft, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/LocalLoader'

const PAGE_SIZES = [8, 25, 50, 100]

function pct(v) { return Number(v).toFixed(2) + '%' }

function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Tax Ledger Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-2">
          {[
            ['Tax Ledger Account', row.ledgerName],
            ['Tax Percent', pct(row.taxPercent)],
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

const emptyForm = { ledgerName: '', taxPercent: '' }

export default function TaxLedgerMaster({ onNavigate }) {
  const toast = useToast()
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(emptyForm)
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
      const res = await api.get('/api/tax-ledger')
      if (res.data.success) setRows(res.data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load tax ledgers')
    } finally {
      setTableLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    if (!form.ledgerName.trim()) return toast.warning('Tax Ledger A/C is required')

    const payload = {
      ledgerName: form.ledgerName.trim(),
      taxPercent: parseFloat(form.taxPercent || 0),
    }

    setLoading(true)
    try {
      if (editId !== null) {
        await api.put(`/api/tax-ledger/${editId}`, payload)
        toast.success('Updated successfully')
      } else {
        await api.post('/api/tax-ledger', payload)
        toast.success('Created successfully')
      }
      setForm(emptyForm)
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
    setForm({ ledgerName: row.ledgerName, taxPercent: String(row.taxPercent) })
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    setDeleteId(id)
    try {
      await api.delete(`/api/tax-ledger/${id}`)
      toast.success('Deleted successfully')
      await fetchAll()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleteId(null)
    }
  }

  const handleCancel = () => {
    setForm(emptyForm)
    setEditId(null)
  }

  const filtered = rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors" onClick={() => onNavigate && onNavigate('Dashboard')}>Dashboard</span>
        <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Tax Ledger A/C Master</span>
      </div>

      {/* Form */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Tax Ledger A/C' : 'Create - Tax Ledger A/C'}
          </h2>
        </div>

        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0">
              <span className="text-red-500">*</span> Tax Ledger A/C :
            </label>
            <input
              type="text"
              value={form.ledgerName}
              onChange={e => setForm(f => ({ ...f, ledgerName: e.target.value }))}
              className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
              placeholder="e.g. GST 18%"
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0">Tax Percent % :</label>
            <input
              type="number"
              value={form.taxPercent}
              onChange={e => setForm(f => ({ ...f, taxPercent: e.target.value }))}
              className="w-48 border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
              placeholder="0"
              min="0"
              step="0.01"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] disabled:opacity-50 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {loading ? (editId !== null ? 'Updating...' : 'Creating...') : (editId !== null ? 'Update' : 'Create')}
            </button>
            {editId !== null ? (
              <button onClick={handleCancel}
                className="px-4 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold rounded transition-colors">
                Cancel
              </button>
            ) : (
              <button onClick={() => onNavigate && onNavigate('TaxMaster')}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#5bc0de] hover:bg-[#46b8da] text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
                <ArrowLeft className="w-4 h-4" /> Back to Tax Master
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#337ab7] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Tax Ledger Account Details</h2>
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
          <TableSkeleton rows={5} cols={['40%', '20%', '13%', '13%', '14%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Tax Ledger Account', 'Tax Percent', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-[13px]">No records found</td></tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-3 py-2.5 text-center">{row.ledgerName}</td>
                  <td className="px-3 py-2.5 text-center">{pct(row.taxPercent)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 bg-[#5bc0de] hover:bg-[#46b8da] text-white text-[12px] font-semibold rounded transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleDelete(row.id)}
                      disabled={deleteId === row.id}
                      className="px-3 py-1.5 bg-[#d9534f] hover:bg-[#c9302c] disabled:opacity-50 text-white text-[12px] font-semibold rounded transition-colors">
                      {deleteId === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setDetailRow(row)}
                      className="px-3 py-1.5 bg-[#337ab7] hover:bg-[#286090] text-white text-[12px] font-semibold rounded transition-colors">
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
