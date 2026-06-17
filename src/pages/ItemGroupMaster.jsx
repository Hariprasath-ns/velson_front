import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { X, Save, ArrowLeft, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { TableSkeleton, SpinnerLoader } from '../components/LocalLoader'

const PAGE_SIZES = [8, 25, 50, 100]
const emptyForm = { groupName: '', store: '', prefix: '' }

function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Item Group Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-2">
          {[
            ['Group Name', row.groupName],
            ['Store', row.store],
            ['Prefix', row.prefix],
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

export default function ItemGroupMaster() {
  const toast = useToast()

  // ── Dropdown options from API ──────────────────────────────
  const [storeOptions, setStoreOptions] = useState([])
  const [prefixOptions, setPrefixOptions] = useState([])
  const [dropdownLoading, setDropdownLoading] = useState(true)

  // ── Table data ─────────────────────────────────────────────
  const [rows, setRows] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  // ── Fetch Store options from ReferenceMaster (type = "Store") ──
  const fetchStores = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Store')
      const stores = (res.data.data || []).map(r => r.description)
      setStoreOptions(stores)
    } catch (err) {
      console.error('[ItemGroupMaster] fetchStores error:', err)
      toast.error('Failed to load store options')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch Prefix options from prefix table ─────────────────
  const fetchPrefixes = useCallback(async () => {
    try {
      const res = await api.get('/api/prefixes')
      const prefixes = (res.data.data || []).map(r => r.prefixCode)
      setPrefixOptions(prefixes)
    } catch (err) {
      console.error('[ItemGroupMaster] fetchPrefixes error:', err)
      toast.error('Failed to load prefix options')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  // ── Fetch all item groups ──────────────────────────────────
  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/item-group-master')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[ItemGroupMaster] fetchAll error:', err)
      toast.error('Failed to load item groups')
    } finally {
      setTableLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const init = async () => {
      setDropdownLoading(true)
      await Promise.all([fetchStores(), fetchPrefixes()])
      setDropdownLoading(false)
      fetchAll()
    }
    init()
  }, [fetchStores, fetchPrefixes, fetchAll])

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const validate = () => {
    const errs = {}
    if (!form.groupName.trim()) errs.groupName = 'Enter Item Group Name'
    if (!form.store) errs.store = 'Select Store Name'
    if (!form.prefix) errs.prefix = 'Select Prefix'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save (create / update) ─────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editId !== null) {
        await api.put(`/api/item-group-master/${editId}`, {
          groupName: form.groupName.trim(),
          store: form.store,
          prefix: form.prefix,
        })
        toast.success('Item group updated successfully.')
      } else {
        await api.post('/api/item-group-master', {
          groupName: form.groupName.trim(),
          store: form.store,
          prefix: form.prefix,
        })
        toast.success('Item group created successfully.')
      }
      setForm(emptyForm)
      setErrors({})
      setEditId(null)
      setPage(1)
      await fetchAll()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to save item group.'
      toast.error(msg)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (row) => {
    setForm({ groupName: row.groupName, store: row.store, prefix: row.prefix })
    setErrors({})
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = (id) => setConfirmDelete(id)

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/item-group-master/${confirmDelete}`)
      toast.success('Item group deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) { setForm(emptyForm); setEditId(null) }
      await fetchAll()
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete item group.'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleBack = () => {
    setForm(emptyForm)
    setErrors({})
    setEditId(null)
  }

  // ── Filtering & Pagination ─────────────────────────────────
  const filtered = rows.filter(r =>
    [r.groupName, r.store, r.prefix].some(v =>
      (v || '').toLowerCase().includes(search.toLowerCase())
    )
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  const selCls = (err) =>
    `w-full border rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 bg-white transition-colors ${
      err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
    }`

  const inpCls = (err) =>
    `w-full border rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 transition-colors ${
      err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
    }`

  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Item Group Master</span>
      </div>

      {/* ── Create / Edit Form ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Item Group Master' : 'Create - Item Group Master'}
          </h2>
        </div>

        <div className="p-5 space-y-3 max-w-2xl">
          {/* Item Group */}
          <div className="flex items-start gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-28 shrink-0 pt-1.5">
              Item Group <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <input
                type="text"
                value={form.groupName}
                onChange={e => setField('groupName', e.target.value)}
                placeholder="Enter item group name"
                className={inpCls(errors.groupName)}
              />
              {errors.groupName && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.groupName}</p>
              )}
            </div>
          </div>

          {/* Store Name */}
          <div className="flex items-start gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-28 shrink-0 pt-1.5">
              Store Name <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <div className="relative">
                <select
                  value={form.store}
                  onChange={e => setField('store', e.target.value)}
                  disabled={dropdownLoading}
                  className={selCls(errors.store) + ' disabled:opacity-60'}
                >
                  <option value="">
                    {dropdownLoading ? 'Loading stores...' : '--- Select Store Name ---'}
                  </option>
                  {storeOptions.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                {dropdownLoading && (
                  <SpinnerLoader size={14} className="absolute right-7 top-1/2 -translate-y-1/2 py-0 pointer-events-none" />
                )}
              </div>
              {errors.store && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.store}</p>
              )}
            </div>
          </div>

          {/* Prefix */}
          <div className="flex items-start gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-28 shrink-0 pt-1.5">
              Prefix <span className="text-red-500">*</span>
            </label>
            <div className="flex-1">
              <div className="relative">
                <select
                  value={form.prefix}
                  onChange={e => setField('prefix', e.target.value)}
                  disabled={dropdownLoading}
                  className={selCls(errors.prefix) + ' disabled:opacity-60'}
                >
                  <option value="">
                    {dropdownLoading ? 'Loading prefixes...' : '--- Select Prefix ---'}
                  </option>
                  {prefixOptions.map((p, i) => (
                    <option key={i} value={p}>{p}</option>
                  ))}
                </select>
                {dropdownLoading && (
                  <SpinnerLoader size={14} className="absolute right-7 top-1/2 -translate-y-1/2 py-0 pointer-events-none" />
                )}
              </div>
              {errors.prefix && (
                <p className="text-[11px] text-red-500 mt-0.5">{errors.prefix}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || dropdownLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId !== null ? 'Update' : 'Create'}
            </button>
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Back to List
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Item Group Name Details</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Search:
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40"
            />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Show
            <select
              value={pageSize}
              onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7]"
            >
              {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>

        {/* Table */}
        {tableLoading ? (
          <TableSkeleton rows={5} cols={['30%', '25%', '18%', '9%', '9%', '9%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { label: 'Group Name', sortable: true },
                  { label: 'Store', sortable: true },
                  { label: 'Prefix', sortable: true },
                  { label: 'Edit', sortable: false },
                  { label: 'Delete', sortable: false },
                  { label: 'Details', sortable: false },
                ].map(({ label, sortable }) => (
                  <th key={label} className="text-center px-4 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">
                    {label}
                    {sortable && (
                      <svg className="inline w-3 h-3 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-400 text-[13px]">No records found</td>
                </tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-4 py-2.5 text-center">{row.groupName}</td>
                  <td className="px-4 py-2.5 text-center">{row.store}</td>
                  <td className="px-4 py-2.5 text-center font-semibold text-[#0097A7]">{row.prefix}</td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[12px] rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleDeleteConfirm(row.id)}
                      disabled={deleting}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      {deleting && confirmDelete === row.id
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors"
                      title="Details"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {pageNums().map((n, i) =>
              n === '...' ? (
                <span key={`ellipsis-${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 text-[12px] rounded border transition-colors ${
                    page === n
                      ? 'bg-[#0097A7] text-white border-[#0097A7]'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {n}
                </button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this item group? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
