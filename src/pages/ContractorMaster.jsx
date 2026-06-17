import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, Search, Users, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZES = [4, 10, 25, 50]
const empty = { Contract_Code: '', Contract_Name: '', Address: '', Phone: '', Email: '', Status: 'Active' }

export default function ContractorMaster() {
  const toast = useToast()
  const [rows, setRows]           = useState([])
  const [form, setForm]           = useState({ ...empty })
  const [errors, setErrors]       = useState({})
  const [editId, setEditId]       = useState(null)
  const [search, setSearch]       = useState('')
  const [pageSize, setPageSize]   = useState(4)
  const [page, setPage]           = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await axios.get('/api/contractor-master')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[ContractorMaster] fetchAll:', err)
    } finally {
      setTableLoading(false)
    }
  }, [])

  const fetchNextCode = useCallback(async () => {
    try {
      const res = await axios.get('/api/contractor-master/next-code')
      setForm(f => ({ ...f, Contract_Code: res.data.nextCode || '' }))
    } catch (err) {
      console.error('[ContractorMaster] fetchNextCode:', err)
    }
  }, [])

  useEffect(() => { fetchAll(); fetchNextCode() }, [fetchAll, fetchNextCode])

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.Contract_Name.trim()) e.Contract_Name = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        contractCode:  form.Contract_Code,
        contractName:  form.Contract_Name,
        address:       form.Address,
        phone:         form.Phone,
        email:         form.Email,
        status:        form.Status,
        createdBy:     'Admin',
        updatedBy:     'Admin',
      }
      if (editId !== null) {
        await axios.put(`/api/contractor-master/${editId}`, payload)
        toast.success('Contractor updated successfully.')
      } else {
        await axios.post('/api/contractor-master', payload)
        toast.success('Contractor created successfully.')
      }
      setForm({ ...empty }); setErrors({}); setEditId(null); setPage(1)
      await fetchAll(); await fetchNextCode()
    } catch (err) {
      const status = err?.response?.status
      if (status === 409) {
        toast.error('Contractor code already exists. Please use a different code.')
      } else {
        toast.error(err?.response?.data?.message || 'Failed to save contractor.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = r => {
    setForm({
      Contract_Code: r.contractCode,
      Contract_Name: r.contractName,
      Address:       r.address  || '',
      Phone:         r.phone    || '',
      Email:         r.email    || '',
      Status:        r.status   || 'Active',
    })
    setErrors({}); setEditId(r.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await axios.delete(`/api/contractor-master/${confirmDelete}`)
      toast.success('Contractor deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) { setForm({ ...empty }); setEditId(null) }
      await fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete contractor.')
    }
  }

  const handleClear = async () => {
    setForm({ ...empty }); setErrors({}); setEditId(null)
    await fetchNextCode()
  }

  const filtered = rows.filter(r =>
    [r.contractCode, r.contractName, r.phone, r.email, r.status, r.address].some(v =>
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

  const inputCls = (err) =>
    `w-full border rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 transition-all bg-white ${err
      ? 'border-red-400 focus:ring-red-200'
      : 'border-slate-300 focus:ring-[#0097A7]/30 focus:border-[#0097A7]'
    }`

  const COLS = ['#', 'Code', 'Contractor Name', 'Phone Number', 'Address', 'Status', 'Created Date', 'Created By', 'Edit', 'Delete', 'Details']

  return (
    <div className="p-5 space-y-5 w-full min-w-0 bg-slate-50 min-h-screen">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Contractor Master</span>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-white font-semibold text-[14px] tracking-wide">
            {editId !== null ? 'Edit' : 'Create'} — Contractor Master Details
          </h2>
          {editId !== null && (
            <span className="ml-auto text-[11px] bg-white/20 text-white px-2.5 py-0.5 rounded-full font-medium">
              Editing ID #{editId}
            </span>
          )}
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 max-w-4xl">

            {/* Contractor Code — read-only, auto-generated */}
            <div className="space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-1">
                Contractor Code
              </label>
              <input
                value={form.Contract_Code}
                readOnly
                className={`${inputCls(false)} bg-slate-50 cursor-not-allowed text-slate-500`}
              />
            </div>

            {/* Contractor Name */}
            <div className="space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600 flex items-center gap-1">
                <span className="text-red-500">*</span>Contractor Name
              </label>
              <input
                value={form.Contract_Name}
                onChange={e => sf('Contract_Name', e.target.value)}
                placeholder="Enter contractor name"
                className={inputCls(errors.Contract_Name)}
              />
              {errors.Contract_Name && <p className="text-[11px] text-red-500">{errors.Contract_Name}</p>}
            </div>

            {/* Phone */}
            <div className="space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600">Phone Number</label>
              <input
                value={form.Phone}
                onChange={e => sf('Phone', e.target.value)}
                placeholder="e.g. 9876543210"
                className={inputCls(false)}
              />
            </div>

            {/* Email */}
            <div className="space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600">Email</label>
              <input
                type="email"
                value={form.Email}
                onChange={e => sf('Email', e.target.value)}
                placeholder="e.g. name@example.com"
                className={inputCls(false)}
              />
            </div>

            {/* Address */}
            <div className="sm:col-span-2 space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600">Address</label>
              <textarea
                value={form.Address}
                onChange={e => sf('Address', e.target.value)}
                rows={2}
                placeholder="Enter full address"
                className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 focus:border-[#0097A7] transition-all resize-none"
              />
            </div>

            {/* Status */}
            <div className="space-y-0.5">
              <label className="text-[12px] font-semibold text-slate-600">Status</label>
              <select value={form.Status} onChange={e => sf('Status', e.target.value)} className={inputCls(false)}>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2.5 pt-3 mt-3 border-t border-slate-100 justify-start">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId !== null ? 'Update' : 'Create'}
            </button>
            <button onClick={handleClear} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60">
              <RotateCcw className="w-4 h-4" />Clear
            </button>
            <button onClick={() => { fetchAll(); setPage(1) }} disabled={tableLoading}
              className="flex items-center gap-2 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60">
              {tableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
              Display All
            </button>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3">
          <h2 className="text-white font-semibold text-[14px] tracking-wide text-center">Contractor Master Details</h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search contractors..."
              className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 focus:border-[#0097A7] w-52 transition-all" />
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

        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                {COLS.map(h => (
                  <th key={h} className="text-center px-3 py-3 font-bold text-slate-600 text-[11.5px] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableLoading ? (
                <tr><td colSpan={COLS.length} className="text-center py-12 text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0097A7]" /> Loading...
                  </div>
                </td></tr>
              ) : paged.length === 0 ? (
                <tr><td colSpan={COLS.length} className="text-center py-12 text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="w-8 h-8 text-slate-200" /><span>No records found</span>
                  </div>
                </td></tr>
              ) : paged.map((r, idx) => (
                <tr key={r.id} className={`border-b border-slate-100 hover:bg-[#0097A7]/5 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-3 py-2.5 text-center"><span className="font-semibold text-[#0097A7]">{r.contractCode}</span></td>
                  <td className="px-3 py-2.5 text-center font-medium text-slate-700">{r.contractName}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{r.phone || '—'}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600 max-w-[160px] truncate" title={r.address}>{r.address || '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold gap-1 ${r.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200'
                      : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}</td>
                  <td className="px-3 py-2.5 text-center text-slate-500">{r.createdBy || '—'}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => handleEdit(r)} title="Edit"
                      className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded-lg transition-colors shadow-sm">
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setConfirmDelete(r.id)} title="Delete"
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-sm">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button onClick={() => setDetailRow(r)} title="View Details"
                      className="inline-flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-700 text-white rounded-lg transition-colors shadow-sm">
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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

      {/* Detail Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-white font-bold text-[15px]">Contractor Details</h2>
              </div>
              <button onClick={() => setDetailRow(null)} className="text-white/70 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-0">
              {[
                ['Code',           detailRow.contractCode],
                ['Contractor Name',detailRow.contractName],
                ['Phone Number',   detailRow.phone],
                ['Email',          detailRow.email],
                ['Address',        detailRow.address],
                ['Status',         detailRow.status],
                ['Created Date',   detailRow.createdAt ? new Date(detailRow.createdAt).toLocaleDateString() : '—'],
                ['Created By',     detailRow.createdBy],
              ].map(([label, value]) => (
                <div key={label} className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider w-32 shrink-0">{label}</span>
                  {label === 'Status'
                    ? <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${value === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${value === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {value}
                      </span>
                    : <span className="text-[13px] text-slate-800 font-medium text-right flex-1">{value || '—'}</span>
                  }
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

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this contractor? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
