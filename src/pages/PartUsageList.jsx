import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, Search, Plus, Save, RotateCcw, List, Edit, Trash2, Info, X, Package } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZES = [4, 10, 25, 50]
const GROUPS = ['Mechanical', 'Electrical', 'Hydraulic', 'Pneumatic', 'Structural', 'Consumable']
const empty = { partNo: '', partName: '', group: '', partSpareQty: '' }

export default function PartUsageList() {
  const toast = useToast()

  const [rows, setRows]           = useState([])
  const [itemParts, setItemParts] = useState([])   // [{partNo, partName}] from Item Master
  const [form, setForm]           = useState({ ...empty })
  const [errors, setErrors]       = useState({})
  const [editId, setEditId]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [pageSize, setPageSize]   = useState(4)
  const [page, setPage]           = useState(1)
  const [detailRow, setDetailRow]   = useState(null)
  const [confirmId, setConfirmId]   = useState(null)
  const [confirming, setConfirming] = useState(false)

  // Load part usage list records from backend
  const fetchList = useCallback(async () => {
    try {
      const { data } = await api.get('/api/part-usage-list')
      setRows(data.data || [])
    } catch {
      toast.error('Failed to load part usage list')
    }
  }, [toast])

  // Load item master part numbers for dropdown (skip global loader — background fetch)
  const fetchItemParts = useCallback(async () => {
    try {
      const { data } = await api.get('/api/item-master', {
        params: { limit: 5000 },
        skipGlobalLoader: true,
      })
      setItemParts(
        (data.data || []).map(i => ({ partNo: i.partNo, partName: i.partName }))
      )
    } catch {
      // non-critical — dropdown simply stays empty
    }
  }, [])

  useEffect(() => {
    fetchList()
    fetchItemParts()
  }, [fetchList, fetchItemParts])

  // When part number changes, auto-populate part name from item master data
  const handlePartNoChange = (partNo) => {
    const match = itemParts.find(i => i.partNo === partNo)
    setForm(f => ({ ...f, partNo, partName: match ? match.partName : '' }))
    setErrors(e => ({ ...e, partNo: '', partName: '' }))
  }

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.partNo.trim())   e.partNo   = 'Required'
    if (!form.partName.trim()) e.partName = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload = {
      partNo:       form.partNo.trim(),
      partName:     form.partName.trim(),
      group:        form.group || null,
      partSpareQty: form.partSpareQty !== '' ? form.partSpareQty : null,
    }
    try {
      if (editId !== null) {
        const { data } = await api.put(`/api/part-usage-list/${editId}`, payload, {
          loadingMessage: 'Updating...',
        })
        setRows(r => r.map(x => x.id === editId ? data.data : x))
        toast.success('Part usage record updated successfully', 'Updated')
        setEditId(null)
      } else {
        const { data } = await api.post('/api/part-usage-list', payload, {
          loadingMessage: 'Creating...',
        })
        setRows(r => [data.data, ...r])
        toast.success('Part usage record created successfully', 'Created')
      }
      setForm({ ...empty }); setErrors({}); setPage(1); setShowForm(false)
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save record'
      toast.error(msg)
    }
  }

  const handleEdit = (r) => {
    setForm({
      partNo:       r.partNo,
      partName:     r.partName,
      group:        r.group || '',
      partSpareQty: r.partSpareQty ?? '',
    })
    setErrors({}); setEditId(r.id)
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => setConfirmId(id)

  const handleConfirmDelete = async () => {
    setConfirming(true)
    try {
      await api.delete(`/api/part-usage-list/${confirmId}`, { loadingMessage: 'Deleting...' })
      setRows(r => r.filter(x => x.id !== confirmId))
      toast.success('Part usage record deleted', 'Deleted')
      if (page > 1 && paged.length === 1) setPage(p => p - 1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete record')
    } finally {
      setConfirming(false)
      setConfirmId(null)
    }
  }

  const handleClear  = () => { setForm({ ...empty }); setErrors({}); setEditId(null) }
  const handleCancel = () => { setForm({ ...empty }); setErrors({}); setEditId(null); setShowForm(false) }

  const filtered = rows.filter(r =>
    [r.partNo, r.partName, r.group].some(v =>
      String(v || '').toLowerCase().includes(search.toLowerCase())
    )
  )
  const total = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pNums = () => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const ps = [1]
    if (page > 3) ps.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) ps.push(i)
    if (page < total - 2) ps.push('...')
    ps.push(total)
    return ps
  }

  const inp = (err) =>
    `w-full border rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 transition-all bg-white ${
      err ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-[#0097A7]/30 focus:border-[#0097A7]'
    }`
  const lbl = 'block text-[12px] font-semibold text-slate-600 mb-0.5'

  const COLS = ['SNo', 'Part Number', 'Part Name', 'Group', 'Part Spare Qty', 'Edit', 'Delete', 'Details']

  return (
    <div className="p-5 space-y-4 w-full min-w-0 bg-slate-50 min-h-screen">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Part Usage List</span>
      </div>

      {/* Create New Button */}
      {!showForm && (
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...empty }) }}
          className="flex items-center gap-2 px-4 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create New
        </button>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-semibold text-[14px] tracking-wide">
              {editId !== null ? 'Edit' : 'Create'} — Part Usage List
            </h2>
            {editId !== null && (
              <span className="ml-auto text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium">
                Editing ID #{editId}
              </span>
            )}
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3 max-w-4xl">

              {/* Part Number dropdown */}
              <div>
                <label className={lbl}><span className="text-red-500">*</span> Part Number</label>
                <select
                  value={form.partNo}
                  onChange={e => handlePartNoChange(e.target.value)}
                  className={inp(errors.partNo)}
                >
                  <option value="">--- Select Part No ---</option>
                  {itemParts.map(i => (
                    <option key={i.partNo} value={i.partNo}>{i.partNo}</option>
                  ))}
                </select>
                {errors.partNo && <p className="text-[11px] text-red-500 mt-0.5">{errors.partNo}</p>}
              </div>

              {/* Part Name — auto-filled, read-only */}
              <div>
                <label className={lbl}><span className="text-red-500">*</span> Part Name</label>
                <input
                  value={form.partName}
                  readOnly
                  placeholder="Auto-populated from Part Number"
                  className={`${inp(errors.partName)} bg-slate-50 cursor-default`}
                />
                {errors.partName && <p className="text-[11px] text-red-500 mt-0.5">{errors.partName}</p>}
              </div>

              {/* Group */}
              <div>
                <label className={lbl}>Group</label>
                <select value={form.group} onChange={e => sf('group', e.target.value)} className={inp(false)}>
                  <option value="">--- Select Group ---</option>
                  {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              {/* Part Spare Qty */}
              <div>
                <label className={lbl}>Part Spare Qty</label>
                <input
                  type="number"
                  value={form.partSpareQty}
                  onChange={e => sf('partSpareQty', e.target.value)}
                  placeholder="0"
                  className={inp(false)}
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2.5 pt-3 mt-3 border-t border-slate-100">
              <button onClick={handleSave}
                className="flex items-center gap-2 px-5 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm">
                <Save className="w-4 h-4" />{editId !== null ? 'Update' : 'Create'}
              </button>
              <button onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm">
                <RotateCcw className="w-4 h-4" />Clear
              </button>
              <button onClick={() => { setPage(1); fetchList() }}
                className="flex items-center gap-2 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm">
                <List className="w-4 h-4" />Display All
              </button>
              <button onClick={handleCancel}
                className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[13px] font-semibold rounded-lg transition-colors ml-auto">
                <X className="w-4 h-4" />Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3">
          <h2 className="text-white font-semibold text-[14px] tracking-wide text-center">Part Usage List Details</h2>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search parts..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 focus:border-[#0097A7] w-52 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-500">
            <span>Show</span>
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30">
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            <span>entries</span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                {COLS.map(h => (
                  <th key={h} className="text-center px-3 py-3 font-bold text-slate-600 text-[11.5px] uppercase tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={COLS.length} className="text-center py-12 text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Package className="w-8 h-8 text-slate-200" />
                      <span>No records found</span>
                    </div>
                  </td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-[#0097A7]/5 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-[#0097A7]">{r.partNo}</td>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-700">{r.partName}</td>
                    <td className="px-3 py-2.5 text-center">
                      {r.group
                        ? <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">{r.group}</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-700">{r.partSpareQty ?? '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => handleEdit(r)} title="Edit"
                        className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded-lg transition-colors shadow-sm">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => handleDelete(r.id)} title="Delete"
                        className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => setDetailRow(r)} title="Details"
                        className="inline-flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors shadow-sm">
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-slate-100 bg-slate-50/60">
          <span className="text-[12px] text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">{Math.min(page * pageSize, filtered.length)}</span> of{' '}
            <span className="font-semibold text-slate-700">{filtered.length}</span> entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors">
              Previous
            </button>
            {pNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-1.5 text-slate-400 text-[13px]">…</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 text-[12px] rounded-lg border font-semibold transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7] shadow-sm' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                    {n}
                  </button>
            )}
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded-lg hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-600 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmId !== null}
        message="Delete this part usage record? This action cannot be undone."
        confirming={confirming}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmId(null)}
      />

      {/* Detail Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Package className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-bold text-[15px]">Part Details</h2>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {[
                ['Part Number',    detailRow.partNo],
                ['Part Name',      detailRow.partName],
                ['Group',          detailRow.group],
                ['Part Spare Qty', detailRow.partSpareQty],
                ['Created By',     detailRow.createdBy],
                ['Created Date',   detailRow.createdAt ? new Date(detailRow.createdAt).toLocaleDateString() : null],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider w-32 shrink-0">{label}</span>
                  <span className="text-[13px] text-slate-800 font-medium text-right flex-1">{value ?? '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 pt-2">
              <button onClick={() => setDetailRow(null)}
                className="w-full py-2.5 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-xl transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
