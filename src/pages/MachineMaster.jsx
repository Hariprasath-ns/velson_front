MachineMaster.jsx 

import { useState, useEffect } from 'react'
import { Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, X } from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const PAGE_SIZES = [5, 10, 25, 50]

const today = new Date().toISOString().split('T')[0]

const empty = {
  machineCode: '', machineName: '', serialNo: '', machineCategoryId: '',
  workHoursPerDay: '', model: '', country: '',
  currency: '', vendorId: '', installationPlace: '', remarks: '',
  yearOfFG: today, dateOfPurchase: today,
  dateOfInstallation: today, warantyExpDate: today, amcExpDate: today,
  manufacture: '', price: '',
}

const toDateStr = (v) => (v ? new Date(v).toISOString().split('T')[0] : '')

const inp = (err) =>
  `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`

const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap'

function Panel({ children }) {
  return (
    <div className="border border-[#0097A7] rounded overflow-hidden">
      <div className="h-[5px] bg-gradient-to-r from-[#0097A7] to-[#00BCD4]" />
      <div className="p-3 space-y-2">{children}</div>
    </div>
  )
}

function FR({ label, fk, required, form, sf, errors, readOnly, type = 'text', placeholder }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`${lbl} w-36 shrink-0`}>
        {required && <span className="text-red-500">*</span>}{label} :
      </label>
      <div className="flex-1">
        <input
          type={type}
          value={form[fk] || ''}
          onChange={e => sf(fk, e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder || ''}
          className={readOnly ? `${inp(false)} bg-slate-50` : inp(errors[fk])}
        />
        {errors[fk] && <p className="text-[11px] text-red-500 mt-0.5">{errors[fk]}</p>}
      </div>
    </div>
  )
}

function FRSelect({ label, fk, required, form, sf, errors, options, placeholder, loading }) {
  return (
    <div className="flex items-center gap-2">
      <label className={`${lbl} w-36 shrink-0`}>
        {required && <span className="text-red-500">*</span>}{label} :
      </label>
      <div className="flex-1">
        <select 
          value={form[fk] || ''} 
          onChange={e => sf(fk, e.target.value)} 
          disabled={loading}
          className={loading ? `${inp(errors[fk])} bg-slate-50 cursor-not-allowed` : inp(errors[fk])}
        >
          <option value="">{loading ? 'Loading…' : (placeholder || `--- Select ${label} ---`)}</option>
          {!loading && options.map(o => <option key={o}>{o}</option>)}
        </select>
        {errors[fk] && <p className="text-[11px] text-red-500 mt-0.5">{errors[fk]}</p>}
      </div>
    </div>
  )
}

export default function MachineMaster() {
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [selectedRow, setSelectedRow] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dropdownsLoading, setDropdownsLoading] = useState(false)

  useEffect(() => {
    fetchAll()
    fetchDropdowns()
    fetchNextCode()
  }, [])

  const fetchAll = async () => {
    try {
      const res = await api.get('/api/machine-master')
      setRows(res.data.data || [])
    } catch {
      toast.error('Failed to load machine records')
    }
  }

  const fetchNextCode = async () => {
    try {
      const res = await api.get('/api/machine-master/next-code')
      setForm(f => ({ ...f, machineCode: res.data.nextCode || '' }))
    } catch (err) {
      console.error('[MachineMaster] fetchNextCode:', err)
    }
  }

  const fetchDropdowns = async () => {
    setDropdownsLoading(true)
    try {
      await Promise.allSettled([
        api.get('/api/supplier-master')
          .then(res => setVendors((res.data.data || []).map(s => s.supplierName).filter(Boolean)))
          .catch(() => {}),
        api.get(`/api/reference-master/${encodeURIComponent('Machine Category')}`)
          .then(res => setCategories((res.data.data || []).map(r => r.description || r.code).filter(Boolean)))
          .catch(() => {}),
        api.get(`/api/reference-master/${encodeURIComponent('Currency')}`)
          .then(res => setCurrencies((res.data.data || []).map(r => r.description || r.code).filter(Boolean)))
          .catch(() => {}),
      ])
    } finally {
      setDropdownsLoading(false)
    }
  }

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.machineName.trim()) e.machineName = 'Required'
    if (!form.machineCategoryId) e.machineCategoryId = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editId !== null) {
        const res = await api.put(`/api/machine-master/${editId}`, form, { loadingMessage: 'Updating machine...' })
        setRows(r => r.map(x => x.id === editId ? res.data.data : x))
        toast.success('Machine updated successfully', 'Success')
        setEditId(null)
      } else {
        const res = await api.post('/api/machine-master', form, { loadingMessage: 'Saving machine...' })
        setRows(r => [res.data.data, ...r])
        toast.success('Machine created successfully', 'Success')
      }
      setForm({ ...empty }); setErrors({}); setPage(1); setSelectedRow(null)
      await fetchNextCode()
    } catch (err) {
      const msg = err.response?.data?.message || 'Save failed'
      toast.error(msg)
    }
  }

  const handleEdit = (r) => {
    setForm({
      ...r,
      yearOfFG:           toDateStr(r.yearOfFG),
      dateOfPurchase:     toDateStr(r.dateOfPurchase),
      dateOfInstallation: toDateStr(r.dateOfInstallation),
      warantyExpDate:     toDateStr(r.warantyExpDate),
      amcExpDate:         toDateStr(r.amcExpDate),
    })
    setErrors({})
    setEditId(r.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await api.delete(`/api/machine-master/${deleteTarget.id}`, { loadingMessage: 'Deleting machine...' })
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      toast.success('Machine deleted successfully', 'Deleted')
      if (selectedRow?.id === deleteTarget.id) {
        setSelectedRow(null)
      }
      setDeleteTarget(null)
    } catch (err) {
      const msg = err.response?.data?.message || 'Delete failed'
      toast.error(msg)
    } finally {
      setDeleting(false)
    }
  }

  const handleClear = async () => {
    setForm({ ...empty })
    setErrors({})
    setEditId(null)
    setSelectedRow(null)
    await fetchNextCode()
  }

  const handleEditClick = () => {
    if (!selectedRow) {
      toast.error('Please select a record from the table first')
      return
    }
    handleEdit(selectedRow)
  }

  const handleDeleteClick = () => {
    if (!selectedRow) {
      toast.error('Please select a record from the table first')
      return
    }
    setDeleteTarget(selectedRow)
  }

  const filtered = rows.filter(r =>
    [r.machineCode, r.machineName, r.machineCategoryId, r.serialNo, r.model, r.country, r.vendorId]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
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

  const fp = { form, sf, errors }

  const TABLE_COLS = [
    'MachineID', 'Name', 'SerialNo', 'Machinecategory', 'WorkHoursPerDay',
    'Model', 'Manufacture', 'Year_Of_FG', 'Country', 'Price', 'Currency',
    'Date_of_Purchase', 'Vendo_Name', 'WarantyExpDate', 'AMCExpDate',
    'Date_of_Installlation', 'Installation_Place', 'Remarks', 'User',
    'Edit', 'Delete', 'Details'
  ]

  return (
    <div className="p-4 space-y-4 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Machine Master</span>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-4 py-2">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit' : 'Create'} - Machine Master Details
          </h2>
        </div>

        <div className="p-3 space-y-4">
          <div className="grid grid-cols-3 gap-3">

            {/* ── Panel 1: Machine Info ── */}
            <Panel>
              <FR {...fp} label="Machine Code" fk="machineCode" readOnly />
              <FR {...fp} label="Machine Name" fk="machineName" required />
              <FR {...fp} label="Machine Serial No" fk="serialNo" />
              <FRSelect {...fp} label="Machine Category" fk="machineCategoryId" required options={categories} placeholder="Select Machine Category Name" loading={dropdownsLoading} />
              <FR {...fp} label="Work Hours/Day" fk="workHoursPerDay" />
              <FR {...fp} label="Model" fk="model" />
              <FR {...fp} label="Manufacture" fk="manufacture" />
              <FR {...fp} label="Country" fk="country" />
            </Panel>

            {/* ── Panel 2: Purchase & Vendor ── */}
            <Panel>
              <FRSelect {...fp} label="Currency" fk="currency" options={currencies} placeholder="Select Currency" loading={dropdownsLoading} />
              <FR {...fp} label="Price" fk="price" type="number" />
              <FRSelect {...fp} label="Vendor Name" fk="vendorId" options={vendors} placeholder="--- Select Vendor Name ---" loading={dropdownsLoading} />
              <FR {...fp} label="Installation Place" fk="installationPlace" />
              <FR {...fp} label="Remarks" fk="remarks" />
              <FR {...fp} label="Year_Of_FG" fk="yearOfFG" type="date" />
              <FR {...fp} label="Date of Purchase" fk="dateOfPurchase" type="date" />
            </Panel>

            {/* ── Panel 3: Dates ── */}
            <Panel>
              <FR {...fp} label="Date of Installation" fk="dateOfInstallation" type="date" />
              <FR {...fp} label="WarantyExpDate" fk="warantyExpDate" type="date" />
              <FR {...fp} label="AMCExpDate" fk="amcExpDate" type="date" />
            </Panel>

          </div>

          {/* Action Buttons Row aligned to the right */}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 flex-wrap">
            <button onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
              <Save className="w-4 h-4" />{editId !== null ? 'Update' : 'Create'}
            </button>
            <button onClick={handleEditClick}
              disabled={!selectedRow}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded transition-colors shadow-sm text-white ${
                selectedRow 
                  ? 'bg-[#0097A7] hover:bg-[#007a87]' 
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}>
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button onClick={handleDeleteClick}
              disabled={!selectedRow}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-[13px] font-semibold rounded transition-colors shadow-sm text-white ${
                selectedRow 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-slate-300 cursor-not-allowed opacity-60'
              }`}>
              <Trash2 className="w-4 h-4" /> Delete
            </button>
            <button onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm">
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
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Machine Master Details</h2>
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
                {TABLE_COLS.map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={TABLE_COLS.length} className="text-center py-8 text-slate-400">No records found</td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} 
                    onClick={() => setSelectedRow(r)}
                    className={`border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer ${
                      selectedRow?.id === r.id 
                        ? 'bg-[#0097A7]/10 font-medium' 
                        : idx % 2 === 1 ? 'bg-slate-50/50' : ''
                    }`}>
                    <td className="px-3 py-2 text-center font-medium text-[#0097A7]">{r.machineCode}</td>
                    <td className="px-3 py-2 text-center font-medium">{r.machineName}</td>
                    <td className="px-3 py-2 text-center">{r.serialNo}</td>
                    <td className="px-3 py-2 text-center">{r.machineCategoryId}</td>
                    <td className="px-3 py-2 text-center">{r.workHoursPerDay}</td>
                    <td className="px-3 py-2 text-center">{r.model}</td>
                    <td className="px-3 py-2 text-center">{r.manufacture || '—'}</td>
                    <td className="px-3 py-2 text-center">{toDateStr(r.yearOfFG)}</td>
                    <td className="px-3 py-2 text-center">{r.country}</td>
                    <td className="px-3 py-2 text-center">{r.price || '—'}</td>
                    <td className="px-3 py-2 text-center">{r.currency}</td>
                    <td className="px-3 py-2 text-center">{toDateStr(r.dateOfPurchase)}</td>
                    <td className="px-3 py-2 text-center">{r.vendorId}</td>
                    <td className="px-3 py-2 text-center">{toDateStr(r.warantyExpDate)}</td>
                    <td className="px-3 py-2 text-center">{toDateStr(r.amcExpDate)}</td>
                    <td className="px-3 py-2 text-center">{toDateStr(r.dateOfInstallation)}</td>
                    <td className="px-3 py-2 text-center">{r.installationPlace}</td>
                    <td className="px-3 py-2 text-center">{r.remarks}</td>
                    <td className="px-3 py-2 text-center">{r.createdBy || '—'}</td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={(e) => { e.stopPropagation(); handleEdit(r); setSelectedRow(r); }}
                        className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); setSelectedRow(r); }}
                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <button onClick={(e) => { e.stopPropagation(); setDetailRow(r); setSelectedRow(r); }}
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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-[15px]">Machine Details</h2>
              <button onClick={() => setDetailRow(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-1.5 max-h-[70vh] overflow-y-auto">
              {[
                ['Machine Code', detailRow.machineCode], ['Machine Name', detailRow.machineName],
                ['Serial No', detailRow.serialNo], ['Category', detailRow.machineCategoryId],
                ['Work Hours/Day', detailRow.workHoursPerDay], ['Model', detailRow.model],
                ['Manufacture', detailRow.manufacture], ['Country', detailRow.country],
                ['Price', detailRow.price], ['Currency', detailRow.currency],
                ['Vendor', detailRow.vendorId], ['Installation Place', detailRow.installationPlace],
                ['Remarks', detailRow.remarks], ['Year Of FG', toDateStr(detailRow.yearOfFG)],
                ['Date of Purchase', toDateStr(detailRow.dateOfPurchase)],
                ['Date of Installation', toDateStr(detailRow.dateOfInstallation)],
                ['Warranty Exp Date', toDateStr(detailRow.warantyExpDate)],
                ['AMC Exp Date', toDateStr(detailRow.amcExpDate)],
                ['Created By', detailRow.createdBy],
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
        message={`Delete machine "${deleteTarget?.machineName}"? This action cannot be undone.`}
        confirming={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}