import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { Plus, X, Save, Edit, Trash2, Info, ChevronRight, Loader2, ArrowLeft } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { TableSkeleton } from '../components/LocalLoader'

const PAGE_SIZES = [10, 25, 50, 100]

const emptyForm = {
  categoryId: '',
  subCategoryId: '',
  prefixCode: '',
  digitCount: '',
  startingNumber: '',
  endingNumber: '',
  totalNumbers: '',
}

const emptyCatForm   = { categoryName: '' }
const emptySubForm   = { subCategoryName: '', prefixCode: '', description: '', categoryId: '' }

// ── Input / Select helpers ─────────────────────────────────────────
const inpCls = (err) =>
  `w-full border rounded px-2 py-1.5 text-[13px] focus:outline-none focus:ring-1 transition-colors ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`

const selCls = (err) =>
  `w-full border rounded px-2 py-1.5 text-[13px] bg-white focus:outline-none focus:ring-1 transition-colors appearance-none ${
    err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
  }`

const FieldRow = ({ label, required, error, children }) => (
  <div className="flex items-start gap-3">
    <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0 pt-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex-1">
      {children}
      {error && <p className="text-[11px] text-red-500 mt-0.5">{error}</p>}
    </div>
  </div>
)

// ── CategoryCreateModal ────────────────────────────────────────────
function CategoryCreateModal({ onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm]     = useState(emptyCatForm)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const errs = {}
    if (!form.categoryName.trim()) errs.categoryName = 'Category name required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await api.post('/api/categories', {
        categoryName: form.categoryName.trim(),
      })
      toast.success(`Category "${res.data.data.categoryName}" created.`)
      onCreated(res.data.data)
      onClose()
    } catch (err) {
      console.error('[PartNumberBase] createCategory error:', err)
      toast.error(err?.response?.data?.message || 'Failed to create category')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-[14px]">Add New Category</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Category Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.categoryName}
              onChange={e => set('categoryName', e.target.value)}
              placeholder="e.g. STORE"
              className={inpCls(errors.categoryName)}
            />
            {errors.categoryName && <p className="text-[11px] text-red-500 mt-0.5">{errors.categoryName}</p>}
          </div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] text-white bg-[#27ae60] hover:bg-[#229954] rounded transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SubCategoryCreateModal ─────────────────────────────────────────
function SubCategoryCreateModal({ categories, defaultCategoryId, onClose, onCreated }) {
  const toast = useToast()
  const [form, setForm]     = useState({ ...emptySubForm, categoryId: defaultCategoryId || '' })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const errs = {}
    if (!form.categoryId)              errs.categoryId      = 'Category required'
    if (!form.subCategoryName.trim())  errs.subCategoryName = 'SubCategory name required'
    if (!form.prefixCode.trim())       errs.prefixCode      = 'Prefix code required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const res = await api.post('/api/subcategories', {
        categoryId:      Number(form.categoryId),
        subCategoryName: form.subCategoryName.trim(),
        prefixCode:      form.prefixCode.trim(),
        description:     form.description.trim() || null,
      })
      toast.success(`SubCategory "${res.data.data.subCategoryName}" created.`)
      onCreated(res.data.data)
      onClose()
    } catch (err) {
      console.error('[PartNumberBase] createSubCategory error:', err)
      toast.error(err?.response?.data?.message || 'Failed to create subcategory')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 flex items-center justify-between">
          <h3 className="text-white font-bold text-[14px]">Add New SubCategory</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Category <span className="text-red-500">*</span></label>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)} className={selCls(errors.categoryId)}>
              <option value="">-- Select Category --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.categoryName}</option>)}
            </select>
            {errors.categoryId && <p className="text-[11px] text-red-500 mt-0.5">{errors.categoryId}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">SubCategory Name <span className="text-red-500">*</span></label>
            <input type="text" value={form.subCategoryName} onChange={e => set('subCategoryName', e.target.value)} placeholder="e.g. TOOLS" className={inpCls(errors.subCategoryName)} />
            {errors.subCategoryName && <p className="text-[11px] text-red-500 mt-0.5">{errors.subCategoryName}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Prefix Code <span className="text-red-500">*</span></label>
            <input type="text" value={form.prefixCode} onChange={e => set('prefixCode', e.target.value)} placeholder="e.g. VT" className={inpCls(errors.prefixCode)} />
            {errors.prefixCode && <p className="text-[11px] text-red-500 mt-0.5">{errors.prefixCode}</p>}
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-600 mb-1">Description</label>
            <input type="text" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description" className={inpCls(false)} />
          </div>
        </div>
        <div className="px-5 pb-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-1.5 text-[13px] text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 text-[13px] text-white bg-[#27ae60] hover:bg-[#229954] rounded transition-colors disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

// ── DetailModal ────────────────────────────────────────────────────
function DetailModal({ row, onClose }) {
  const fields = [
    ['Category',        row.category?.categoryName || row.categoryId],
    ['Sub Category',    row.subCategory?.subCategoryName || row.subCategoryId],
    ['Prefix',          row.prefixCode],
    ['Digit Count',     row.digitCount],
    ['Starting Number', row.startingNumber],
    ['Ending Number',   row.endingNumber],
    ['Total Numbers',   row.totalNumbers],
    ['Current Running', row.currentRunningNumber],
    ['Status',          row.isActive ? 'Active' : 'Inactive'],
  ]
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Part Number Base Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-1.5">
          {fields.map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{lbl}</span>
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

// ── Main Component ─────────────────────────────────────────────────
export default function PartNumberBaseMaster() {
  const toast = useToast()

  // Form state
  const [form, setForm]     = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  // Dropdown data
  const [categories,    setCategories]    = useState([])
  const [subCategories, setSubCategories] = useState([])
  const [catLoading,    setCatLoading]    = useState(false)
  const [subCatLoading, setSubCatLoading] = useState(false)

  // Table data
  const [rows,         setRows]         = useState([])
  const [tableLoading, setTableLoading] = useState(false)
  const [deleting,     setDeleting]     = useState(false)

  // UI state
  const [showCatModal,    setShowCatModal]    = useState(false)
  const [showSubCatModal, setShowSubCatModal] = useState(false)
  const [detailRow,       setDetailRow]       = useState(null)
  const [confirmDelete,   setConfirmDelete]   = useState(null)
  const [search,          setSearch]          = useState('')
  const [page,            setPage]            = useState(1)
  const [pageSize,        setPageSize]        = useState(10)

  // ── Fetchers ──────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setCatLoading(true)
    try {
      const res = await api.get('/api/categories')
      setCategories(res.data.data || [])
    } catch (err) {
      console.error('[PartNumberBase] fetchCategories error:', err)
      toast.error('Failed to load categories')
    } finally {
      setCatLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSubCategoriesByCat = useCallback(async (categoryId) => {
    if (!categoryId) { setSubCategories([]); return }
    setSubCatLoading(true)
    try {
      const res = await api.get(`/api/subcategories/category/${categoryId}`)
      setSubCategories(res.data.data || [])
    } catch (err) {
      console.error('[PartNumberBase] fetchSubCategories error:', err)
      toast.error('Failed to load subcategories')
      setSubCategories([])
    } finally {
      setSubCatLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchAll = useCallback(async () => {
    setTableLoading(true)
    try {
      const res = await api.get('/api/part-number-base')
      setRows(res.data.data || [])
    } catch (err) {
      console.error('[PartNumberBase] fetchAll error:', err)
      toast.error('Failed to load part number base records')
    } finally {
      setTableLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchCategories()
    fetchAll()
  }, [fetchCategories, fetchAll])

  // ── Form helpers ──────────────────────────────────────────────────
  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  // Auto-calc totalNumbers when start/end change
  useEffect(() => {
    const s = Number(form.startingNumber)
    const e = Number(form.endingNumber)
    if (s > 0 && e > s) {
      setForm(f => ({ ...f, totalNumbers: String(e - s) }))
    } else {
      setForm(f => ({ ...f, totalNumbers: '' }))
    }
  }, [form.startingNumber, form.endingNumber])

  // ── Category change → reload subcategories ─────────────────────
  const handleCategoryChange = async (catId) => {
    setField('categoryId', catId)
    setField('subCategoryId', '')
    setField('prefixCode', '')
    setSubCategories([])
    if (catId) await fetchSubCategoriesByCat(catId)
  }

  // ── SubCategory change → auto-fill prefix ─────────────────────
  const handleSubCategoryChange = (subCatId) => {
    setField('subCategoryId', subCatId)
    const sub = subCategories.find(s => s.id === Number(subCatId))
    setField('prefixCode', sub ? sub.prefixCode : '')
  }

  // ── Validation ────────────────────────────────────────────────────
  const validate = () => {
    const errs = {}
    if (!form.categoryId)              errs.categoryId      = 'Select a category'
    if (!form.subCategoryId)           errs.subCategoryId   = 'Select a subcategory'
    if (!form.prefixCode.trim())       errs.prefixCode      = 'Prefix is required'
    if (!form.digitCount || Number(form.digitCount) < 1)
                                       errs.digitCount      = 'Digit count must be ≥ 1'
    if (!form.startingNumber)          errs.startingNumber  = 'Starting number required'
    if (!form.endingNumber)            errs.endingNumber    = 'Ending number required'
    if (form.startingNumber && form.endingNumber && Number(form.endingNumber) <= Number(form.startingNumber))
                                       errs.endingNumber    = 'Ending number must be greater than starting number'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Save (create / update) ────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {
        categoryId:     Number(form.categoryId),
        subCategoryId:  Number(form.subCategoryId),
        prefixCode:     form.prefixCode.trim(),
        digitCount:     Number(form.digitCount),
        startingNumber: Number(form.startingNumber),
        endingNumber:   Number(form.endingNumber),
      }
      if (editId !== null) {
        await api.put(`/api/part-number-base/${editId}`, payload)
        toast.success('Record updated successfully.')
      } else {
        await api.post('/api/part-number-base', payload)
        toast.success('Record created successfully.')
      }
      resetForm()
      setPage(1)
      await fetchAll()
    } catch (err) {
      console.error('[PartNumberBase] save error:', err)
      toast.error(err?.response?.data?.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setForm(emptyForm)
    setErrors({})
    setEditId(null)
    setSubCategories([])
  }

  // ── Edit ──────────────────────────────────────────────────────────
  const handleEdit = async (row) => {
    await fetchSubCategoriesByCat(row.categoryId)
    setForm({
      categoryId:     String(row.categoryId),
      subCategoryId:  String(row.subCategoryId),
      prefixCode:     row.prefixCode,
      digitCount:     String(row.digitCount),
      startingNumber: String(row.startingNumber),
      endingNumber:   String(row.endingNumber),
      totalNumbers:   String(row.totalNumbers),
    })
    setErrors({})
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // ── Delete ────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/part-number-base/${confirmDelete}`)
      toast.success('Record deleted.')
      setConfirmDelete(null)
      if (editId === confirmDelete) resetForm()
      await fetchAll()
    } catch (err) {
      console.error('[PartNumberBase] delete error:', err)
      toast.error(err?.response?.data?.message || 'Failed to delete record')
    } finally {
      setDeleting(false)
    }
  }

  // ── Category/SubCat inline create callbacks ───────────────────────
  const handleCategoryCreated = async (newCat) => {
    await fetchCategories()
    handleCategoryChange(String(newCat.id))
  }

  const handleSubCategoryCreated = async (newSub) => {
    if (form.categoryId) {
      await fetchSubCategoriesByCat(form.categoryId)
      handleSubCategoryChange(String(newSub.id))
    }
  }

  // ── Filter + Pagination ───────────────────────────────────────────
  const filtered = rows.filter(r => {
    const q = search.toLowerCase()
    return [
      r.category?.categoryName,
      r.subCategory?.subCategoryName,
      r.prefixCode,
      String(r.digitCount),
      String(r.startingNumber),
      String(r.endingNumber),
    ].some(v => (v || '').toLowerCase().includes(q))
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged      = filtered.slice((page - 1) * pageSize, page * pageSize)

  const pageNums = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = [1]
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Part Number Base Master</span>
      </div>

      {/* ── Create / Edit Form ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit – Part Number Base' : 'Create – Part Number Base'}
          </h2>
        </div>

        <div className="p-5 space-y-3 max-w-2xl">

          {/* Category */}
          <FieldRow label="Category" required error={errors.categoryId}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={form.categoryId}
                  onChange={e => handleCategoryChange(e.target.value)}
                  disabled={catLoading}
                  className={selCls(errors.categoryId) + ' disabled:opacity-60'}
                >
                  <option value="">{catLoading ? 'Loading…' : '--- Select Category ---'}</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.categoryName}</option>
                  ))}
                </select>
                {catLoading && (
                  <Loader2 className="animate-spin absolute right-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0097A7] pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowCatModal(true)}
                title="Add new category"
                className="flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </FieldRow>

          {/* SubCategory */}
          <FieldRow label="Sub Category" required error={errors.subCategoryId}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <select
                  value={form.subCategoryId}
                  onChange={e => handleSubCategoryChange(e.target.value)}
                  disabled={subCatLoading || !form.categoryId}
                  className={selCls(errors.subCategoryId) + ' disabled:opacity-60'}
                >
                  <option value="">
                    {subCatLoading ? 'Loading…' : form.categoryId ? '--- Select Sub Category ---' : '--- Select Category first ---'}
                  </option>
                  {subCategories.map(s => (
                    <option key={s.id} value={s.id}>{s.subCategoryName}</option>
                  ))}
                </select>
                {subCatLoading && (
                  <Loader2 className="animate-spin absolute right-7 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#0097A7] pointer-events-none" />
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowSubCatModal(true)}
                disabled={!form.categoryId}
                title="Add new subcategory"
                className="flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </FieldRow>

          {/* Prefix (readonly) */}
          <FieldRow label="Prefix Code" required error={errors.prefixCode}>
            <input
              type="text"
              value={form.prefixCode}
              readOnly
              placeholder="Auto-filled from sub category"
              className={inpCls(errors.prefixCode) + ' bg-slate-50 cursor-not-allowed'}
            />
            {form.prefixCode && (
              <p className="text-[11px] text-[#0097A7] mt-0.5">Auto-filled from selected sub category</p>
            )}
          </FieldRow>

          {/* Digit Count */}
          <FieldRow label="Digit Count" required error={errors.digitCount}>
            <input
              type="number"
              min="1"
              value={form.digitCount}
              onChange={e => setField('digitCount', e.target.value)}
              placeholder="e.g. 5"
              className={inpCls(errors.digitCount)}
            />
          </FieldRow>

          {/* Starting Number */}
          <FieldRow label="Starting Number" required error={errors.startingNumber}>
            <input
              type="number"
              min="0"
              value={form.startingNumber}
              onChange={e => setField('startingNumber', e.target.value)}
              placeholder="e.g. 10"
              className={inpCls(errors.startingNumber)}
            />
          </FieldRow>

          {/* Ending Number */}
          <FieldRow label="Ending Number" required error={errors.endingNumber}>
            <input
              type="number"
              min="0"
              value={form.endingNumber}
              onChange={e => setField('endingNumber', e.target.value)}
              placeholder="e.g. 9999"
              className={inpCls(errors.endingNumber)}
            />
          </FieldRow>

          {/* Total Numbers (auto-calculated) */}
          <FieldRow label="Total Numbers" error={null}>
            <input
              type="text"
              value={form.totalNumbers}
              readOnly
              placeholder="Auto-calculated"
              className={inpCls(false) + ' bg-slate-50 cursor-not-allowed'}
            />
            {form.totalNumbers && (
              <p className="text-[11px] text-slate-400 mt-0.5">= Ending − Starting = {form.totalNumbers}</p>
            )}
          </FieldRow>


          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editId !== null ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Part Number Base Details</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
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
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Search:
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-44"
            />
          </div>
        </div>

        {/* Table */}
        {tableLoading ? (
          <TableSkeleton rows={5} cols={['14%','14%','12%','9%','12%','12%','9%','9%','9%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  'Category', 'Sub Category', 'Prefix', 'Digits',
                  'Starting No', 'Ending No', 'Total',
                  'Edit', 'Delete', 'Details',
                ].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-8 text-slate-400 text-[13px]">
                    No records found
                  </td>
                </tr>
              ) : paged.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                >
                  <td className="px-3 py-2.5 text-center font-medium">{row.category?.categoryName || '—'}</td>
                  <td className="px-3 py-2.5 text-center">{row.subCategory?.subCategoryName || '—'}</td>
                  <td className="px-3 py-2.5 text-center font-mono font-semibold text-[#0097A7]">{row.prefixCode}</td>
                  <td className="px-3 py-2.5 text-center">{row.digitCount}</td>
                  <td className="px-3 py-2.5 text-center">{row.startingNumber}</td>
                  <td className="px-3 py-2.5 text-center">{row.endingNumber}</td>
                  <td className="px-3 py-2.5 text-center">{row.totalNumbers}</td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="p-1.5 bg-[--color-main] hover:bg-[#3498db] text-white rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => setConfirmDelete(row.id)}
                      disabled={deleting}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded transition-colors disabled:opacity-60"
                      title="Delete"
                    >
                      {deleting && confirmDelete === row.id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      className="p-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors"
                      title="Details"
                    >
                      <Info className="w-3.5 h-3.5" />
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
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >Previous</button>
            {pageNums().map((n, i) =>
              n === '...' ? (
                <span key={`e-${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
              ) : (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 text-[12px] rounded border transition-colors ${
                    page === n
                      ? 'bg-[#0097A7] text-white border-[#0097A7]'
                      : 'border-slate-300 hover:bg-slate-100 text-slate-600'
                  }`}
                >{n}</button>
              )
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >Next</button>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      {showCatModal && (
        <CategoryCreateModal
          onClose={() => setShowCatModal(false)}
          onCreated={handleCategoryCreated}
        />
      )}

      {showSubCatModal && (
        <SubCategoryCreateModal
          categories={categories}
          defaultCategoryId={form.categoryId}
          onClose={() => setShowSubCatModal(false)}
          onCreated={handleSubCategoryCreated}
        />
      )}

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this part number base record? This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
