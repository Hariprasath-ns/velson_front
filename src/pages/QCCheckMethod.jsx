import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, Search, Plus, Save, RotateCcw, List, Edit, Trash2, Info, X, FlaskConical } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZES = [4, 10, 25, 50]
const empty = { checkCode: '', checkName: '', description: '', status: 'A' }

export default function QCCheckMethod() {
  const toast = useToast()

  const [rows, setRows]           = useState([])
  const [form, setForm]           = useState({ ...empty })
  const [errors, setErrors]       = useState({})
  const [editId, setEditId]       = useState(null)
  const [showForm, setShowForm]   = useState(false)
  const [search, setSearch]       = useState('')
  const [pageSize, setPageSize]   = useState(4)
  const [page, setPage]           = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const fetchList = useCallback(async () => {
    try {
      const { data } = await api.get('/api/qc-check-method')
      setRows(data.data || [])
    } catch {
      toast.error('Failed to load QC Check Methods')
    }
  }, [toast])

  useEffect(() => { fetchList() }, [fetchList])

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.checkCode.trim()) e.checkCode = 'Required'
    if (!form.checkName.trim()) e.checkName = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    const payload = {
      checkCode:   form.checkCode.trim().toUpperCase(),
      checkName:   form.checkName.trim(),
      description: form.description.trim() || null,
      status:      form.status,
    }
    try {
      if (editId !== null) {
        const { data } = await api.put(`/api/qc-check-method/${editId}`, payload, {
          loadingMessage: 'Updating...',
        })
        setRows(r => r.map(x => x.id === editId ? data.data : x))
        toast.success('QC Check Method updated successfully', 'Updated')
        setEditId(null)
      } else {
        const { data } = await api.post('/api/qc-check-method', payload, {
          loadingMessage: 'Creating...',
        })
        setRows(r => [data.data, ...r])
        toast.success('QC Check Method created successfully', 'Created')
      }
      setForm({ ...empty }); setErrors({}); setPage(1); setShowForm(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save record')
    }
  }

  const handleEdit = (r) => {
    setForm({
      checkCode:   r.checkCode,
      checkName:   r.checkName,
      description: r.description || '',
      status:      r.status,
    })
    setErrors({}); setEditId(r.id)
    setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleConfirmDelete = async () => {
    setConfirming(true)
    try {
      await api.delete(`/api/qc-check-method/${confirmId}`, { loadingMessage: 'Deleting...' })
      setRows(r => r.filter(x => x.id !== confirmId))
      toast.success('QC Check Method deleted', 'Deleted')
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
    [r.checkCode, r.checkName, r.description].some(v =>
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

  const COLS = ['S.No', 'Code', 'Check Name', 'Description', 'Status', 'Edit', 'Delete', 'Details']

  return (
    <div className="p-5 space-y-4 w-full min-w-0 bg-slate-50 min-h-screen">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span>
        <ChevronRight className="w-3 h-3" />
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">QC Check Method Master</span>
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
              <FlaskConical className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-white font-semibold text-[14px] tracking-wide">
              {editId !== null ? 'Edit' : 'Create'} — QC Check Method Master
            </h2>
            {editId !== null && (
              <span className="ml-auto text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium">
                Editing ID #{editId}
              </span>
            )}
          </div>

          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-5 gap-y-3 max-w-4xl">
              <div>
                <label className={lbl}><span className="text-red-500">*</span> Check Code</label>
                <input
                  value={form.checkCode}
                  onChange={e => sf('checkCode', e.target.value.toUpperCase())}
                  placeholder="e.g. VIS, DIM"
                  className={inp(errors.checkCode)}
                />
                {errors.checkCode && <p className="text-[11px] text-red-500 mt-0.5">{errors.checkCode}</p>}
              </div>

              <div>
                <label className={lbl}><span className="text-red-500">*</span> Check Name</label>
                <input
                  value={form.checkName}
                  onChange={e => sf('checkName', e.target.value)}
                  placeholder="e.g. Visual Inspection"
                  className={inp(errors.checkName)}
                />
                {errors.checkName && <p className="text-[11px] text-red-500 mt-0.5">{errors.checkName}</p>}
              </div>

              <div>
                <label className={lbl}>Status</label>
                <select value={form.status} onChange={e => sf('status', e.target.value)} className={inp(false)}>
                  <option value="A">Active</option>
                  <option value="I">Inactive</option>
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label className={lbl}>Description</label>
                <textarea
                  value={form.description}
                  onChange={e => sf('description', e.target.value)}
                  rows={2}
                  placeholder="Enter method description..."
                  className={`${inp(false)} resize-none`}
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
          <h2 className="text-white font-semibold text-[14px] tracking-wide text-center">QC Check Method Details</h2>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search methods..."
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
                      <FlaskConical className="w-8 h-8 text-slate-200" />
                      <span>No records found</span>
                    </div>
                  </td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-[#0097A7]/5 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                    <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-3 py-2.5 text-center font-bold font-mono text-[#0097A7]">{r.checkCode}</td>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-700">{r.checkName}</td>
                    <td className="px-3 py-2.5 text-left max-w-[220px]">
                      <span className="block truncate text-slate-500">{r.description || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${
                        r.status === 'A'
                          ? 'bg-green-50 text-green-700 ring-green-200'
                          : 'bg-slate-100 text-slate-500 ring-slate-200'
                      }`}>
                        {r.status === 'A' ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => handleEdit(r)} title="Edit"
                        className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded-lg transition-colors shadow-sm">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => setConfirmId(r.id)} title="Delete"
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

      {/* Confirm Delete */}
      <ConfirmDialog
        open={confirmId !== null}
        message="Delete this QC Check Method? This action cannot be undone."
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
                  <FlaskConical className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-bold text-[15px]">Method Details</h2>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5">
              {[
                ['Code',        detailRow.checkCode],
                ['Check Name',  detailRow.checkName],
                ['Status',      detailRow.status === 'A' ? 'Active' : 'Inactive'],
                ['Description', detailRow.description],
                ['Created By',  detailRow.createdBy],
                ['Created Date', detailRow.createdAt ? new Date(detailRow.createdAt).toLocaleDateString() : null],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider w-28 shrink-0">{label}</span>
                  <span className="text-[13px] text-slate-800 font-medium text-right flex-1">{value || '—'}</span>
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
