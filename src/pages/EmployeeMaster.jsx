import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { TableSkeleton } from '../components/LocalLoader'

const PAGE_SIZES = [5, 10, 25, 50]

const emptyForm = {
  empCode: '', empName: '', address: '', contactNo: '', adharNo: '',
  joinDate: new Date().toISOString().slice(0, 10), relevingDate: '',
  department: '', designation: '', contractPerson: '', companyName: '',
  team: '', emailId: '', repPerson: '', status: 'Active',
}

const inp = (err) =>
  `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`
const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap w-36 shrink-0'

// ── Field: label LEFT, input RIGHT ───────────────────────────────────────────
function FI({ label, fk, type = 'text', required, readOnly, form, sf, errors }) {
  return (
    <div className="flex items-center gap-2">
      <label className={lbl}>{required && <span className="text-red-500">*</span>}{label} :</label>
      <div className="flex-1">
        <input type={type} value={form[fk] || ''} onChange={e => sf(fk, e.target.value)}
          readOnly={readOnly}
          className={readOnly ? `${inp(false)} bg-slate-50` : inp(errors[fk])} />
        {errors[fk] && <p className="text-[11px] text-red-500 mt-0.5">{errors[fk]}</p>}
      </div>
    </div>
  )
}

// ── Select: label LEFT, select RIGHT ─────────────────────────────────────────
function FS({ label, fk, opts, required, placeholder, form, sf, errors }) {
  return (
    <div className="flex items-center gap-2">
      <label className={lbl}>{required && <span className="text-red-500">*</span>}{label} :</label>
      <div className="flex-1">
        <select value={form[fk] || ''} onChange={e => sf(fk, e.target.value)} className={inp(errors[fk])}>
          <option value="">{placeholder || `---Select ${label}---`}</option>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
        {errors[fk] && <p className="text-[11px] text-red-500 mt-0.5">{errors[fk]}</p>}
      </div>
    </div>
  )
}

// ── Blue-bordered panel ───────────────────────────────────────────────────────
function Panel({ children }) {
  return (
    <div className="border border-[#1a6fa8] rounded overflow-hidden">
      <div className="h-[5px] bg-[#0097A7]" />
      <div className="p-3 h-full flex flex-col justify-evenly gap-2">
        {children}</div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }) {
  const fmt = (v) => {
    if (!v) return '—'
    if (v instanceof Date || (typeof v === 'string' && v.includes('T')))
      return new Date(v).toLocaleDateString('en-IN')
    return v
  }
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Employee Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-1.5 max-h-[70vh] overflow-y-auto">
          {[
            ['Code', row.empCode], ['Name', row.empName],
            ['Department', row.department], ['Designation', row.designation],
            ['Contractor', row.contractPerson], ['Company', row.companyName],
            ['Contact No', row.contactNo], ['Aadhaar No', row.adharNo],
            ['Join Date', fmt(row.joinDate)], ['Releving Date', fmt(row.relevingDate)],
            ['Team', row.team], ['Email ID', row.emailId],
            ['Reporting Person', row.repPerson], ['Status', row.status],
          ].map(([l, v]) => (
            <div key={l} className="flex flex-col py-1 border-b border-slate-100">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span>
              <span className="text-[13px] text-slate-800 font-medium">{v || '—'}</span>
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeMaster() {
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [companies, setCompanies] = useState([])
  const [departments, setDepartments] = useState([])
  const [designations, setDesignations] = useState([])
  const [contractors, setContractors] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/employee-master')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[EmployeeMaster] fetchAll:', err)
      toast.error('Failed to load employee records')
    } finally {
      setTableLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNextCode = useCallback(async () => {
    try {
      const res = await api.get('/api/employee-master/next-code')
      setForm(f => ({ ...f, empCode: res.data.nextCode || '' }))
    } catch (err) {
      console.error('[EmployeeMaster] fetchNextCode:', err)
    }
  }, [])

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await api.get('/api/company-master')
      setCompanies((res.data.data || []).map(c => c.companyName))
    } catch {
      setCompanies([])
    }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Department')
      setDepartments((res.data.data || []).map(d => d.description))
    } catch {
      setDepartments([])
    }
  }, [])

  const fetchDesignations = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Designation')
      setDesignations((res.data.data || []).map(d => d.description))
    } catch {
      setDesignations([])
    }
  }, [])

  const fetchContractors = useCallback(async () => {
    try {
      const res = await api.get('/api/contractor-master')
      setContractors((res.data.data || []).map(c => c.contractName))
    } catch {
      setContractors([])
    }
  }, [])

  useEffect(() => {
    fetchAll(); fetchNextCode(); fetchCompanies()
    fetchDepartments(); fetchDesignations(); fetchContractors()
  }, [fetchAll, fetchNextCode, fetchCompanies, fetchDepartments, fetchDesignations, fetchContractors])

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const errs = {}
    if (!form.empName.trim()) errs.empName = 'Required'
    if (!form.department) errs.department = 'Required'
    if (!form.designation) errs.designation = 'Required'
    if (!form.companyName) errs.companyName = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      if (editId !== null) {
        await api.put(`/api/employee-master/${editId}`, form)
        toast.success('Employee updated successfully.')
      } else {
        await api.post('/api/employee-master', form)
        toast.success('Employee created successfully.')
      }
      setForm({ ...emptyForm }); setErrors({}); setEditId(null); setPage(1)
      await fetchAll(); await fetchNextCode()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save employee.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = row => {
    const toDateStr = (v) => v ? new Date(v).toISOString().slice(0, 10) : ''
    setForm({
      empCode: row.empCode || '',
      empName: row.empName || '',
      address: row.address || '',
      contactNo: row.contactNo || '',
      adharNo: row.adharNo || '',
      joinDate: toDateStr(row.joinDate),
      relevingDate: toDateStr(row.relevingDate),
      department: row.department || '',
      designation: row.designation || '',
      contractPerson: row.contractPerson || '',
      companyName: row.companyName || '',
      team: row.team || '',
      emailId: row.emailId || '',
      repPerson: row.repPerson || '',
      status: row.status || 'Active',
    })
    setErrors({}); setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/employee-master/${confirmDelete}`)
      toast.success('Employee deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) { setForm({ ...emptyForm }); setEditId(null) }
      await fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const handleClear = async () => {
    setForm({ ...emptyForm }); setErrors({}); setEditId(null)
    await fetchNextCode()
  }

  const filtered = rows.filter(r =>
    [r.empCode, r.empName, r.department, r.designation, r.contactNo, r.status]
      .some(v => String(v || '').toLowerCase().includes(search.toLowerCase()))
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const ps = [1]
    if (page > 3) ps.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) ps.push(i)
    if (page < totalPages - 2) ps.push('...')
    ps.push(totalPages)
    return ps
  }

  const fmt = (v) => v ? new Date(v).toLocaleDateString('en-IN') : '—'
  const fp = { form, sf, errors }

  return (
    <div className="p-4 space-y-4 w-full min-w-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Employee Master</span>
      </div>

      {/* ── Title ── */}
      <h2 className="text-center text-[15px] font-bold text-[#0097A7]">Employee Master Details</h2>

      {/* ── Form: 3 panels ── */}
      <div className="grid grid-cols-3 gap-3">

        {/* Panel 1 */}
        <Panel>
          <FI {...fp} label="Employee Code" fk="empCode" required readOnly />
          <FI {...fp} label="Employee Name" fk="empName" required />
          <FI {...fp} label="Address" fk="address" />
          <FI {...fp} label="Contact No" fk="contactNo" />
        </Panel>

        {/* Panel 2 */}
        <Panel>
          <FI {...fp} label="Adhar No" fk="adharNo" />
          <FI {...fp} label="Join Date" fk="joinDate" type="date" />
          <FI {...fp} label="Releving Date" fk="relevingDate" type="date" />
          <FS {...fp} label="Department Name" fk="department" opts={departments} required
            placeholder="---Select Department Name---" />
        </Panel>

        {/* Panel 3 */}
        <Panel>
          <FS {...fp} label="Designation Name" fk="designation" opts={designations} required
            placeholder="---Select Designation Name---" />
          <FS {...fp} label="Contract Person" fk="contractPerson" opts={contractors}
            placeholder="---Select Contractor Name---" />
          <FS {...fp} label="Company Name" fk="companyName"
            opts={companies.length ? companies : ['VELSON INDUSTRIES PVT LTD', 'VELSON SERVICES LLP']}
            required placeholder="---Select Company Name---" />

        </Panel>

      </div>
      {/* Buttons */}
      <div className="flex items-center gap-2 pt-1 justify-end">
        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {editId !== null ? 'Update' : 'Create'}
        </button>
        <button onClick={handleClear} disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
          <RotateCcw className="w-4 h-4" /> Clear
        </button>
        <button onClick={() => { fetchAll(); setPage(1) }} disabled={tableLoading}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
          {tableLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
          Display All
        </button>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#0097A7] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Employee Master Details</h2>
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

        {tableLoading ? (
          <TableSkeleton rows={5} cols={['5%', '7%', '12%', '10%', '8%', '8%', '8%', '8%', '7%', '7%', '7%', '8%', '7%', '7%', '7%']} />
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="min-w-full text-[12px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Code', 'EmployeeName', 'Address', 'ContactNo', 'AdharNo', 'JoinDate', 'RelevingDate',
                    'Department', 'Designation', 'Team', 'EmailID', 'ContractName', 'CreatedBy', 'CreatedDate',
                    'Status', 'Edit', 'Delete', 'Details'].map(h => (
                      <th key={h} className="text-center px-2 py-2.5 font-semibold text-slate-600 text-[11px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0 ? (
                  <tr><td colSpan={19} className="text-center py-8 text-slate-400">No records found</td></tr>
                ) : paged.map((row, idx) => (
                  <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    {/* <td className="px-2 py-2 text-center">{row.id}</td> */}
                    <td className="px-2 py-2 text-center font-medium text-[#0097A7]">{row.empCode}</td>
                    <td className="px-2 py-2 text-center font-medium">{row.empName}</td>
                    <td className="px-2 py-2 text-center">{row.address}</td>
                    <td className="px-2 py-2 text-center">{row.contactNo}</td>
                    <td className="px-2 py-2 text-center">{row.adharNo}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{fmt(row.joinDate)}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{fmt(row.relevingDate)}</td>
                    <td className="px-2 py-2 text-center">{row.department}</td>
                    <td className="px-2 py-2 text-center">{row.designation}</td>
                    <td className="px-2 py-2 text-center">{row.team}</td>
                    <td className="px-2 py-2 text-center">{row.emailId}</td>
                    <td className="px-2 py-2 text-center">{row.contractPerson}</td>
                    <td className="px-2 py-2 text-center">{row.createdBy}</td>
                    <td className="px-2 py-2 text-center whitespace-nowrap">{fmt(row.createdAt)}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${row.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => handleEdit(row)}
                        className="px-2.5 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white rounded transition-colors">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => setConfirmDelete(row.id)} disabled={deleting}
                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-60">
                        {deleting && confirmDelete === row.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => setDetailRow(row)}
                        className="px-2.5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors">
                        <Info className="w-3.5 h-3.5" />
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
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Previous</button>
            {pageNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
                : <button key={n} onClick={() => setPage(n)}
                  className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                  {n}
                </button>
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors">Next</button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
      <ConfirmDialog open={!!confirmDelete} title="Confirm Delete"
        message="Delete this employee? This action cannot be undone."
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
