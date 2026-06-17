import { useState, useRef, useEffect, useCallback } from 'react'
import api from '../services/api'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { TableSkeleton } from '../components/LocalLoader'

const PAGE_SIZES = [5, 10, 25, 50]

const emptyForm = {
  companyCode: '', companyName: '', companyType: '',
  doorNumber: '', street: '', place: '', post: '', city: '', taluk: '',
  district: '', districtCode: '', state: '', stateCode: '', country: 'India', pinCode: '', address: '',
  gstin: '', panNo: '',
  companyPhone: '', companyEmail: '', companyWebsite: '',
  marketingPhone: '', marketingEmail: '', marketingWebsite: '',
  purchasePhone: '', purchaseEmail: '', purchaseWebsite: '',
  salesPhone: '', salesEmail: '', salesWebsite: '',
  servicePhone: '', serviceEmail: '', serviceWebsite: '',
  bankName: '', bankBranch: '', bankAccountType: '', bankAccountName: '',
  bankAccountNumber: '', bankIfscCode: '', bankMicrCode: '',
  bankDistrict: '', bankState: '', bankPinCode: '', bankCountry: '', bankAddress: '',
  logo: null,
}

const inp = (err) =>
  `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`

// ── Field: label on top, input below ─────────────────────────────────────────
function F({ label, fk, required, readOnly, placeholder, type = 'text', form, sf, errors }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-slate-600 mb-0.5">
        {required && <span className="text-red-500">*</span>}{label}
      </label>
      <input
        type={type}
        value={form[fk] || ''}
        onChange={e => sf(fk, e.target.value)}
        readOnly={readOnly}
        placeholder={placeholder || label}
        className={readOnly ? `${inp(false)} bg-slate-50` : inp(errors[fk])}
      />
      {errors[fk] && <p className="text-[11px] text-red-500 mt-0.5">{errors[fk]}</p>}
    </div>
  )
}

// ── Two fields side by side ───────────────────────────────────────────────────
function F2({ l1, f1, l2, f2, req1, req2, ph1, ph2, form, sf, errors }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-0.5">
          {req1 && <span className="text-red-500">*</span>}{l1}
        </label>
        <input value={form[f1] || ''} onChange={e => sf(f1, e.target.value)}
          placeholder={ph1 || l1} className={inp(errors[f1])} />
        {errors[f1] && <p className="text-[11px] text-red-500 mt-0.5">{errors[f1]}</p>}
      </div>
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-0.5">
          {req2 && <span className="text-red-500">*</span>}{l2}
        </label>
        <input value={form[f2] || ''} onChange={e => sf(f2, e.target.value)}
          placeholder={ph2 || l2} className={inp(errors[f2])} />
        {errors[f2] && <p className="text-[11px] text-red-500 mt-0.5">{errors[f2]}</p>}
      </div>
    </div>
  )
}

// ── Bordered panel ────────────────────────────────────────────────────────────
function Panel({ children }) {
  return (
    <div className="border border-[#0097A7] rounded overflow-hidden">
      <div className="h-[5px] bg-[#0097A7]" />
      <div className="p-3 space-y-2">{children}</div>
    </div>
  )
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Company Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {row.logoData && (
            <div className="flex justify-center mb-4 border border-slate-105 p-2 rounded bg-slate-50 w-fit mx-auto shadow-sm animate-fadeIn">
              <img
                src={`/api/company-master/${row.id}/download-logo`}
                alt={`${row.companyName} Logo`}
                className="max-h-28 max-w-full object-contain rounded"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {[
              ['Company Code', row.companyCode], ['Company Name', row.companyName],
              ['Company Type', row.companyType], ['GSTIN', row.gstin],
              ['PAN No', row.panNo], ['City', row.city],
              ['State', row.state], ['Country', row.country],
              ['Pin Code', row.pinCode], ['Company Phone', row.companyPhone],
              ['Company Email', row.companyEmail], ['Bank Name', row.bankName],
              ['Bank Branch', row.bankBranch], ['Account Number', row.bankAccountNumber],
              ['IFSC Code', row.bankIfscCode], ['MICR Code', row.bankMicrCode],
            ].map(([l, v]) => (
              <div key={l} className="flex flex-col py-1 border-b border-slate-100">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span>
                <span className="text-[13px] text-slate-800 font-medium">{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">Close</button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CompanyMaster() {
  const toast = useToast()
  const fileRef = useRef(null)

  const [rows, setRows] = useState([])
  const [companyTypes, setCompanyTypes] = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [form, setForm] = useState({ ...emptyForm })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(5)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const fetchCompanyTypes = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Company_Type')
      setCompanyTypes(res.data.data || [])
    } catch (err) {
      console.error('[CompanyMaster] fetchCompanyTypes:', err)
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/company-master')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[CompanyMaster] fetchAll:', err)
      toast.error('Failed to load company records')
    } finally {
      setTableLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNextCode = useCallback(async () => {
    try {
      const res = await api.get('/api/company-master/next-code')
      setForm(f => ({ ...f, companyCode: res.data.nextCode || '' }))
    } catch (err) {
      console.error('[CompanyMaster] fetchNextCode:', err)
    }
  }, [])

  useEffect(() => { fetchAll(); fetchNextCode(); fetchCompanyTypes() }, [fetchAll, fetchNextCode, fetchCompanyTypes])

  const sf = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
    if (k === 'logo') {
      if (v) {
        if (logoPreview && !logoPreview.startsWith('/api')) {
          URL.revokeObjectURL(logoPreview)
        }
        setLogoPreview(URL.createObjectURL(v))
      } else {
        if (logoPreview && !logoPreview.startsWith('/api')) {
          URL.revokeObjectURL(logoPreview)
        }
        setLogoPreview(null)
      }
    }
  }

  const validate = () => {
    const errs = {}
    if (!form.companyName.trim()) errs.companyName = 'Required'
    if (!form.companyType) errs.companyType = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (k !== 'logo') fd.append(k, v ?? '') })
      if (form.logo) fd.append('logo', form.logo)
      if (editId !== null) {
        await api.put(`/api/company-master/${editId}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Company updated successfully.')
      } else {
        await api.post('/api/company-master', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        toast.success('Company created successfully.')
      }
      setForm({ ...emptyForm }); setErrors({}); setEditId(null); setPage(1)
      if (logoPreview && !logoPreview.startsWith('/api')) {
        URL.revokeObjectURL(logoPreview)
      }
      setLogoPreview(null)
      if (fileRef.current) fileRef.current.value = ''
      await fetchAll(); await fetchNextCode()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save company.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = row => {
    const f = { ...emptyForm }
    Object.keys(emptyForm).forEach(k => { if (k !== 'logo') f[k] = row[k] ?? '' })
    setForm(f); setErrors({}); setEditId(row.id)
    if (logoPreview && !logoPreview.startsWith('/api')) {
      URL.revokeObjectURL(logoPreview)
    }
    if (row.logoData) {
      setLogoPreview(`/api/company-master/${row.id}/download-logo`)
    } else {
      setLogoPreview(null)
    }
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/company-master/${confirmDelete}`)
      toast.success('Company deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) {
        setForm({ ...emptyForm })
        if (logoPreview && !logoPreview.startsWith('/api')) {
          URL.revokeObjectURL(logoPreview)
        }
        setLogoPreview(null)
        setEditId(null)
      }
      await fetchAll()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete.')
    } finally {
      setDeleting(false)
    }
  }

  const handleClear = async () => {
    setForm({ ...emptyForm }); setErrors({}); setEditId(null)
    if (logoPreview && !logoPreview.startsWith('/api')) {
      URL.revokeObjectURL(logoPreview)
    }
    setLogoPreview(null)
    if (fileRef.current) fileRef.current.value = ''
    await fetchNextCode()
  }

  const filtered = rows.filter(r =>
    [r.companyCode, r.companyName, r.companyType, r.city, r.state, r.gstin]
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

  // shared props passed to every F / F2
  const fp = { form, sf, errors }

  return (
    <div className="p-4 space-y-4 w-full min-w-0">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Company Master</span>
      </div>

      {/* ── Form Card ── */}
      <div className="bg-white rounded border border-slate-300 shadow-sm overflow-hidden">
        <div className="bg-[#0097A7] px-4 py-2">
          <h2 className="text-white text-center font-semibold text-[14px]">New Company Master Details Entry</h2>
        </div>

        <div className="p-3">
          <div className="grid grid-cols-3 gap-3">

            {/* ── Panel 1: Company Info ── */}
            <Panel>
              <F {...fp} label="Company Code" fk="companyCode" required readOnly placeholder="Auto-generated" />
              <F {...fp} label="Company Name" fk="companyName" required />
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-0.5">
                  CompanyType
                </label>
                <select value={form.companyType} onChange={e => sf('companyType', e.target.value)}
                  className={inp(errors.companyType)}>
                  <option value=""></option>
                  {companyTypes.map(t => <option key={t.id} value={t.description}>{t.description}</option>)}
                </select>
                {errors.companyType && <p className="text-[11px] text-red-500 mt-0.5">{errors.companyType}</p>}
              </div>
              <F2 {...fp} l1="Door Number" f1="doorNumber" l2="Street" f2="street" />
              <F {...fp} label="Place" fk="place" />
              <F {...fp} label="Post" fk="post" />
              <F {...fp} label="City" fk="city" />
              <F {...fp} label="Taluk" fk="taluk" />
              <F2 {...fp} l1="District" f1="district" l2="District Code" f2="districtCode" />
              <F2 {...fp} l1="State" f1="state" l2="State Code" f2="stateCode" />
              <F2 {...fp} l1="Country" f1="country" l2="PinCode" f2="pinCode" />
              <F {...fp} label="Address" fk="address" />
            </Panel>

            {/* ── Panel 2: Tax & Contacts ── */}
            <Panel>
              <F {...fp} label="GSTIN" fk="gstin" placeholder="GSTIN" />
              <F {...fp} label="PanNo" fk="panNo" placeholder="PanNo" />
              <F2 {...fp} l1="Company Phone Number" f1="companyPhone" ph1="Company Phone Number"
                l2="Company EMail Id" f2="companyEmail" ph2="Company EMail Id" />
              <F {...fp} label="Company Website URL" fk="companyWebsite" placeholder="Company Website URL" />
              <F2 {...fp} l1="Marketing Phone Number" f1="marketingPhone" ph1="Marketing Phone Number"
                l2="Marketing EMail Id" f2="marketingEmail" ph2="Marketing EMail Id" />
              <F {...fp} label="Marketing Website URL" fk="marketingWebsite" placeholder="Marketing Website URL" />
              <F2 {...fp} l1="Purchase Phone Number" f1="purchasePhone" ph1="Purchase Phone Number"
                l2="Purchase EMail Id" f2="purchaseEmail" ph2="Purchase EMail Id" />
              <F {...fp} label="Purchase Website URL" fk="purchaseWebsite" placeholder="Purchase Website URL" />
              <F2 {...fp} l1="Sales Phone Number" f1="salesPhone" ph1="Sales Phone Number"
                l2="Sales EMail Id" f2="salesEmail" ph2="Sales EMail Id" />
              <F {...fp} label="Sales Website URL" fk="salesWebsite" placeholder="Sales Website URL" />
              <F2 {...fp} l1="Service Phone Number" f1="servicePhone" ph1="Service Phone Number"
                l2="Service EMail Id" f2="serviceEmail" ph2="Service EMail Id" />
              <F {...fp} label="Service Website URL" fk="serviceWebsite" placeholder="Service Website URL" />
            </Panel>

            {/* ── Panel 3: Bank ── */}
            <Panel>
              <F {...fp} label="Bank Name" fk="bankName" placeholder="Bank Name" />
              <F2 {...fp} l1="Bank Branch" f1="bankBranch" l2="Bank Account Type" f2="bankAccountType" />
              <F {...fp} label="Bank Account Name" fk="bankAccountName" placeholder="Bank Account Name" />
              <F {...fp} label="Bank Account Number" fk="bankAccountNumber" placeholder="Bank Account Number" />
              <F2 {...fp} l1="Bank IFSCCode" f1="bankIfscCode" l2="Bank MICRCode" f2="bankMicrCode" />
              <F2 {...fp} l1="Bank District" f1="bankDistrict" l2="Bank State" f2="bankState" />
              <F2 {...fp} l1="Bank PinCode" f1="bankPinCode" l2="Bank Country" f2="bankCountry" />
              <F {...fp} label="Bank Address" fk="bankAddress" placeholder="Bank Address" />

              {/* Logo Upload */}
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-600 mb-0.5">Upload Company Logo</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={e => sf('logo', e.target.files[0] || null)}
                  className="w-full text-[12px] border border-slate-300 rounded px-2 py-1 file:mr-2 file:py-0.5 file:px-2 file:text-[11px] file:border-0 file:bg-slate-100 file:rounded cursor-pointer bg-white"
                />
              </div>

              {/* Logo Preview */}
              {logoPreview && (
                <div className="mt-2 border border-slate-200 rounded p-2 bg-slate-50 relative group w-fit shadow-sm animate-fadeIn">
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="max-h-24 max-w-full object-contain rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sf('logo', null)
                      if (fileRef.current) fileRef.current.value = ''
                    }}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition-colors flex items-center justify-center w-5 h-5"
                    title="Remove Logo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editId !== null ? 'Update' : 'Create'}
                </button>
                <button onClick={handleClear} disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60">
                  <RotateCcw className="w-4 h-4" /> Clear
                </button>
              </div>
              <button onClick={() => { fetchAll(); setPage(1) }} disabled={tableLoading}
                className="text-[#0097A7] hover:underline text-[13px] font-semibold flex items-center gap-1 disabled:opacity-60">
                {tableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <List className="w-3.5 h-3.5" />}
                Display All
              </button>
            </Panel>

          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Company Master Details</h2>
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
          <TableSkeleton rows={5} cols={['5%', '8%', '8%', '18%', '10%', '10%', '10%', '13%', '6%', '6%', '6%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['S.No', 'Code', 'Logo', 'Company Name', 'Type', 'City', 'State', 'GSTIN', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-slate-400">No records found</td></tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-3 py-2 text-center">{(page - 1) * pageSize + idx + 1}</td>
                  <td className="px-3 py-2 text-center font-medium text-[#0097A7]">{row.companyCode}</td>
                  <td className="px-3 py-2 text-center">
                    {row.logoData ? (
                      <img
                        src={`/api/company-master/${row.id}/download-logo`}
                        alt="logo"
                        className="w-8 h-8 rounded-full border border-slate-200 object-cover mx-auto"
                      />
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-center font-medium">{row.companyName}</td>
                  <td className="px-3 py-2 text-center">{row.companyType}</td>
                  <td className="px-3 py-2 text-center">{row.city}</td>
                  <td className="px-3 py-2 text-center">{row.state}</td>
                  <td className="px-3 py-2 text-center font-mono text-[12px]">{row.gstin}</td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => handleEdit(row)}
                      className="px-3 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[12px] rounded transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => setConfirmDelete(row.id)} disabled={deleting}
                      className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors disabled:opacity-60">
                      {deleting && confirmDelete === row.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <button onClick={() => setDetailRow(row)}
                      className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors">
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
        message="Delete this company? This action cannot be undone."
        onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} />
    </div>
  )
}
