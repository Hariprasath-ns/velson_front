import { useState, useEffect } from 'react'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZES = [5, 10, 25, 50]

const empty = {
  vehicleTypeId: '',
  serviceName: '',
  labourCharge: '0',
  materialCharge: '0',
}

const inp = (err) =>
  `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`

const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap w-40 shrink-0'

export default function VehicleServiceMaster() {
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchAll()
    api.get(`/api/reference-master/${encodeURIComponent('Vehicle_Type')}`, { skipGlobalLoader: true })
      .then(res => setVehicleTypes((res.data.data || []).map(r => r.description || r.code).filter(Boolean)))
      .catch(() => toast.error('Failed to load vehicle types'))
  }, [])

  const fetchAll = async () => {
    try {
      const res = await api.get('/api/vehicle-service-master')
      setRows(res.data.data || [])
    } catch {
      toast.error('Failed to load vehicle service records')
    }
  }

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.vehicleTypeId) e.vehicleTypeId = 'Required'
    if (!form.serviceName.trim()) e.serviceName = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editId !== null) {
        const res = await api.put(`/api/vehicle-service-master/${editId}`, form, { loadingMessage: 'Updating record...' })
        setRows(r => r.map(x => x.id === editId ? res.data.data : x))
        toast.success('Vehicle service updated successfully', 'Success')
        setEditId(null)
      } else {
        const res = await api.post('/api/vehicle-service-master', form, { loadingMessage: 'Saving record...' })
        setRows(r => [res.data.data, ...r])
        toast.success('Vehicle service created successfully', 'Success')
      }
      setForm({ ...empty }); setErrors({}); setPage(1)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    }
  }

  const handleEdit = r => {
    setForm({
      vehicleTypeId: r.vehicleTypeId,
      serviceName: r.serviceName,
      labourCharge: String(r.labourCharge ?? 0),
      materialCharge: String(r.materialCharge ?? 0),
    })
    setErrors({}); setEditId(r.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await api.delete(`/api/vehicle-service-master/${deleteTarget.id}`, { loadingMessage: 'Deleting record...' })
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      toast.success('Vehicle service deleted successfully', 'Deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const handleClear = () => { setForm({ ...empty }); setErrors({}); setEditId(null) }

  const totalAmt = (r) => (parseFloat(r.labourCharge) || 0) + (parseFloat(r.materialCharge) || 0)

  const filtered = rows.filter(r =>
    [r.vehicleTypeId, r.serviceName].some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
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

  return (
    <div className="p-4 space-y-4 w-full min-w-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Vehicle Service Master</span>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded border border-blue-400 shadow-sm overflow-hidden">
        <div className="h-[5px] bg-[#1a6fa8]" />
        <div className="bg-[#1a6fa8] px-4 py-2">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit' : 'Create'} - Vehicle Service Master
          </h2>
        </div>

        <div className="p-4 space-y-3 max-w-3xl">

          {/* Vehicle Type */}
          <div className="flex items-center gap-2">
            <label className={lbl}><span className="text-red-500">*</span>VehicleType</label>
            <div className="flex-1">
              <select value={form.vehicleTypeId} onChange={e => sf('vehicleTypeId', e.target.value)} className={inp(errors.vehicleTypeId)}>
                <option value="">---Select Vehicle Type---</option>
                {vehicleTypes.map(v => <option key={v}>{v}</option>)}
              </select>
              {errors.vehicleTypeId && <p className="text-[11px] text-red-500 mt-0.5">{errors.vehicleTypeId}</p>}
            </div>
          </div>

          {/* Job Name / Service Name */}
          <div className="flex items-center gap-2">
            <label className={lbl}><span className="text-red-500">*</span>Job Name/Service Name :</label>
            <div className="flex-1">
              <input
                value={form.serviceName}
                onChange={e => sf('serviceName', e.target.value)}
                className={inp(errors.serviceName)}
              />
              {errors.serviceName && <p className="text-[11px] text-red-500 mt-0.5">{errors.serviceName}</p>}
            </div>
          </div>

          {/* Labour Charge */}
          <div className="flex items-center gap-2">
            <label className={lbl}>Labour Charge :</label>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={form.labourCharge}
                onChange={e => sf('labourCharge', e.target.value)}
                className={inp(false)}
              />
            </div>
          </div>

          {/* Material Charge */}
          <div className="flex items-center gap-2">
            <label className={lbl}>Material Charge :</label>
            <div className="flex-1">
              <input
                type="number"
                min="0"
                value={form.materialCharge}
                onChange={e => sf('materialCharge', e.target.value)}
                className={inp(false)}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              <Save className="w-4 h-4" />{editId !== null ? 'Update' : 'Create'}
            </button>
            <button onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
            <button onClick={() => { fetchAll(); setPage(1) }}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              <List className="w-4 h-4" /> Display All
            </button>
          </div>

        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#1a6fa8] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Vehicle Service Master Details</h2>
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
              className="border border-slate-300 rounded px-2 py-1 text-[13px]">
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['ID', 'Vehicle Name', 'Service Name', 'Labour Amount', 'Material Amount', 'Total Amount', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={9} className="text-center py-8 text-slate-400">No records found</td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-3 py-2 text-center">{r.id}</td>
                    <td className="px-3 py-2 text-center font-medium text-[#0097A7]">{r.vehicleTypeId}</td>
                    <td className="px-3 py-2 text-center">{r.serviceName}</td>
                    <td className="px-3 py-2 text-center">{parseFloat(r.labourCharge || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">{parseFloat(r.materialCharge || 0).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center font-semibold">{totalAmt(r).toFixed(2)}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => handleEdit(r)}
                        className="px-3 py-1.5 bg-[#1a6fa8] hover:bg-[#3498db] text-white text-[12px] rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => setDeleteTarget(r)}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={() => setDetailRow(r)}
                        className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Previous</button>
            {pNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
                : <button key={n} onClick={() => setPage(n)}
                    className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                    {n}
                  </button>
            )}
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-[15px]">Vehicle Service Details</h2>
              <button onClick={() => setDetailRow(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-1.5">
              {[
                ['Vehicle Type', detailRow.vehicleTypeId],
                ['Service Name', detailRow.serviceName],
                ['Labour Charge', parseFloat(detailRow.labourCharge || 0).toFixed(2)],
                ['Material Charge', parseFloat(detailRow.materialCharge || 0).toFixed(2)],
                ['Total Amount', totalAmt(detailRow).toFixed(2)],
              ].map(([l, v]) => (
                <div key={l} className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span>
                  <span className="text-[13px] text-slate-800 font-medium">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button onClick={() => setDetailRow(null)}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Confirm Delete"
        message={`Delete service "${deleteTarget?.serviceName}" for ${deleteTarget?.vehicleTypeId}? This action cannot be undone.`}
        confirming={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
