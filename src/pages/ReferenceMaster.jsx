import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { ChevronRight, ChevronDown, Search, Save, Edit2, Trash2, X, FileSpreadsheet, ChevronUp, Plus, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'
import { SpinnerLoader } from '../components/LocalLoader'

export default function ReferenceMaster() {
  const toast = useToast()

  // ── Reference Types (dropdown) ─────────────────────────────
  const [refTypes,      setRefTypes]      = useState([])
  const [typesLoading,  setTypesLoading]  = useState(false)

  // ── Table / form state ─────────────────────────────────────
  const [tableData,     setTableData]     = useState([])
  const [refType,       setRefType]       = useState('')
  const [code,          setCode]          = useState('')
  const [description,   setDescription]   = useState('')
  const [search,        setSearch]        = useState('')
  const [editId,        setEditId]        = useState(null)
  const [tableOpen,     setTableOpen]     = useState(true)
  const [expandedId,    setExpandedId]    = useState(null)
  const [loading,       setLoading]       = useState(false)

  // ── Dialogs ────────────────────────────────────────────────
  const [confirmDelete,  setConfirmDelete]  = useState(false)
  const [showAddType,    setShowAddType]    = useState(false)
  const [newTypeName,    setNewTypeName]    = useState('')
  const [addTypeLoading, setAddTypeLoading] = useState(false)

  // ── Fetch reference types from DB ──────────────────────────
  const fetchRefTypes = useCallback(async () => {
    setTypesLoading(true)
    try {
      const res = await api.get('/api/reference-types')
      setRefTypes(res.data.data || [])
    } catch (err) {
      console.error('[ReferenceMaster] fetchRefTypes error:', err)
      toast.error('Failed to load reference types')
    } finally {
      setTypesLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchRefTypes()
  }, [fetchRefTypes])

  // ── Fetch rows for selected type ──────────────────────────
  const fetchReferenceData = useCallback(async (type) => {
    if (!type) { setTableData([]); setCode(''); return }
    setLoading(true)
    try {
      const res = await api.get(`/api/reference-master/${encodeURIComponent(type)}`)
      setTableData(res.data.data || [])
      setCode(res.data.nextCode || '')
      setDescription('')
      setEditId(null)
      setExpandedId(null)
    } catch (err) {
      console.error('[ReferenceMaster] fetchReferenceData error:', err)
      toast.error('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let active = true
    const run = async () => {
      if (!refType) { setTableData([]); setCode(''); return }
      setLoading(true)
      try {
        const res = await api.get(`/api/reference-master/${encodeURIComponent(refType)}`)
        if (!active) return
        setTableData(res.data.data || [])
        setCode(res.data.nextCode || '')
        setDescription('')
        setEditId(null)
        setExpandedId(null)
      } catch (err) {
        console.error('[ReferenceMaster] fetch error:', err)
        if (active) toast.error('Failed to fetch data')
      } finally {
        if (active) setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [refType]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefTypeChange = (val) => {
    setRefType(val)
    setSearch('')
    setEditId(null)
    setExpandedId(null)
  }

  const handleRowClick = (r) => {
    setRefType(r.referenceType)
    setCode(r.code)
    setDescription(r.description)
    setEditId(r.id)
  }

  // ── Add new Reference Type (saves to DB) ──────────────────
  const handleAddType = async () => {
    const trimmed = newTypeName.trim()
    if (!trimmed) { toast.warning('Type name is required.'); return }

    const duplicate = refTypes.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
    if (duplicate) { toast.warning(`"${trimmed}" already exists.`); return }

    setAddTypeLoading(true)
    try {
      await api.post('/api/reference-types', { name: trimmed })
      await fetchRefTypes()
      handleRefTypeChange(trimmed)
      setNewTypeName('')
      setShowAddType(false)
      toast.success(`"${trimmed}" added to Reference Types.`)
    } catch (err) {
      console.error('[ReferenceMaster] addType error:', err)
      toast.error(err?.response?.data?.error || 'Failed to add reference type.')
    } finally {
      setAddTypeLoading(false)
    }
  }

  // ── Save (create / update) ────────────────────────────────
  const handleSave = async () => {
    if (!refType)          { toast.warning('Reference Type is required.'); return }
    if (!code.trim())      { toast.warning('Code is required.'); return }
    if (!description.trim()) { toast.warning('Description is required.'); return }

    setLoading(true)
    try {
      if (editId) {
        await api.put(`/api/reference-master/${editId}`, {
          referenceType: refType,
          code: code.trim(),
          description: description.trim(),
        })
        toast.success('Record updated.')
      } else {
        const existing = tableData.find(r => r.code === code.trim())
        if (existing) {
          toast.warning('Code already exists for this Reference Type.')
          setLoading(false)
          return
        }
        await api.post('/api/reference-master', {
          referenceType: refType,
          code: code.trim(),
          description: description.trim(),
        })
        toast.success('Record saved.')
      }
      await fetchReferenceData(refType)
    } catch (err) {
      console.error('[ReferenceMaster] save error:', err)
      toast.error(err?.response?.data?.error || 'Failed to save record.')
      setLoading(false)
    }
  }

  const handleEdit = () => {
    if (!editId) { toast.warning('Click a row in the table to select a record first.'); return }
    toast.info('Edit the fields above and click Save.')
  }

  const handleDelete = () => {
    if (!editId) { toast.warning('Click a row in the table to select a record first.'); return }
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    setConfirmDelete(false)
    setLoading(true)
    try {
      await api.delete(`/api/reference-master/${editId}`)
      toast.success('Record deleted.')
      await fetchReferenceData(refType)
    } catch (err) {
      console.error('[ReferenceMaster] delete error:', err)
      toast.error(err?.response?.data?.error || 'Failed to delete record.')
      setLoading(false)
    }
  }

  const handleClear = () => {
    setEditId(null)
    setSearch('')
    setExpandedId(null)
    fetchReferenceData(refType)
  }

  const toggleExpand = (id, e) => {
    e.stopPropagation()
    setExpandedId(prev => prev === id ? null : id)
  }

  const codeSort = (a, b) => {
    const na = parseInt(a.code, 10)
    const nb = parseInt(b.code, 10)
    if (!isNaN(na) && !isNaN(nb)) return na - nb
    return (a.code || '').localeCompare(b.code || '')
  }

  const displayed = (tableData || [])
    .filter(r => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (r.code        || '').toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.updatedBy   || '').toLowerCase().includes(q)
      )
    })
    .sort(codeSort)

  const selectedRecord = (tableData || []).find(r => r.id === editId)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          {/* <span>Dashboard</span>
          <ChevronRight size={12} /> */}
          <span>Master</span>
          <ChevronRight size={12} />
          <span className="text-[#0097A7]">Reference Master</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">

          {/* Module Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Reference Master</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.info('Exporting Excel...')}
                className="flex items-center gap-1 px-3 py-1 text-emerald-600 hover:text-emerald-700 text-[11px] font-bold border border-emerald-300 rounded transition-all"
              >
                <FileSpreadsheet size={13} /> Excel
              </button>
              <button className="flex items-center gap-1 px-3 py-1 text-slate-500 hover:text-red-600 text-[11px] font-bold border border-slate-200 rounded hover:border-red-300 transition-all">
                <X size={13} /> Close
              </button>
            </div>
          </div>

          <div className="p-4 space-y-3">

            {/* ── Form ─────────────────────────────────────────────── */}
            <table className="border-collapse text-[12px]">
              <tbody>
                {/* Reference Type */}
                <tr>
                  <td className="pb-2 pr-3 whitespace-nowrap">
                    <span className="text-red-600 font-bold mr-1">*</span>
                    <span className="text-[11px] font-bold text-slate-700">Reference Type :</span>
                  </td>
                  <td className="pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative">
                        <select
                          value={refType}
                          onChange={e => handleRefTypeChange(e.target.value)}
                          disabled={typesLoading}
                          className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-56 disabled:opacity-60"
                        >
                          <option value="">
                            {typesLoading ? 'Loading...' : 'select option'}
                          </option>
                          {refTypes.map(o => (
                            <option key={o.id} value={o.name}>{o.name}</option>
                          ))}
                        </select>
                        {typesLoading && (
                          <Loader2
                            size={11}
                            className="animate-spin absolute right-7 top-1/2 -translate-y-1/2 text-[#0097A7] pointer-events-none"
                          />
                        )}
                      </div>
                      <button
                        onClick={() => { setNewTypeName(''); setShowAddType(true) }}
                        title="Add new reference type"
                        className="flex items-center gap-0.5 px-2 py-[4px] text-[11px] font-bold text-white bg-[#0097A7] hover:bg-[#00838f] rounded border border-[#0097A7] transition-all active:scale-95 whitespace-nowrap"
                      >
                        <Plus size={11} /> Add
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Code */}
                <tr>
                  <td className="pb-2 pr-3 whitespace-nowrap">
                    <span className="text-red-600 font-bold mr-1">*</span>
                    <span className="text-[11px] font-bold text-slate-700">Code :</span>
                  </td>
                  <td className="pb-2">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-56"
                    />
                  </td>
                </tr>

                {/* Description */}
                <tr>
                  <td className="pr-3 whitespace-nowrap">
                    <span className="text-red-600 font-bold mr-1">*</span>
                    <span className="text-[11px] font-bold text-slate-700">Description :</span>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
                      className="px-2 py-[4px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-56"
                    />
                  </td>
                </tr>
              </tbody>
            </table>

            {/* ── Toolbar ───────────────────────────────────────────── */}
            <div className="flex items-center gap-2 bg-[#6b7a8d] px-3 py-1.5 rounded">
              <span className="text-[11px] font-bold text-white whitespace-nowrap flex items-center gap-1">
                <Search size={12} /> Search
              </span>
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Code / Description / Updated By"
                className="px-2 py-[3px] text-[12px] border border-slate-400 rounded bg-white text-slate-700 focus:outline-none w-52"
              />
              <button
                onClick={() => toast.info(`${displayed.length} record(s) found.`)}
                className="text-white hover:text-slate-200 transition-all"
                title="Search"
              >
                <Search size={14} />
              </button>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-[4px] bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
                </button>
                <button
                  onClick={handleEdit}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-[4px] bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Edit2 size={12} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-[4px] bg-white hover:bg-slate-100 text-red-600 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} /> Delete
                </button>
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="flex items-center gap-1 px-3 py-[4px] bg-white hover:bg-slate-100 text-amber-600 text-[11px] font-bold rounded border border-slate-300 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <X size={12} /> Clear
                </button>
                <button
                  onClick={() => setTableOpen(v => !v)}
                  className="text-white hover:text-slate-200 ml-1 transition-all"
                  title={tableOpen ? 'Collapse table' : 'Expand table'}
                >
                  <ChevronUp size={16} className={`transition-transform ${tableOpen ? '' : 'rotate-180'}`} />
                </button>
              </div>
            </div>

            {/* ── Data Grid ─────────────────────────────────────────── */}
            {tableOpen && (
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
                  <table className="w-full text-left border-collapse min-w-[580px]">
                    <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[10px] uppercase font-bold">
                      <tr>
                        <th className="px-2 py-2.5 border-r border-blue-400 w-8 text-center"></th>
                        <th className="px-3 py-2.5 border-r border-blue-400 w-24 text-center">Code</th>
                        <th className="px-3 py-2.5 border-r border-blue-400">Description</th>
                        <th className="px-3 py-2.5 w-36 text-center">Updated By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loading ? (
                        <tr>
                          <td colSpan={4} className="px-0 py-0 border-none">
                            <SpinnerLoader message="Loading..." />
                          </td>
                        </tr>
                      ) : displayed.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-[12px] text-slate-400">
                            {refType
                              ? search
                                ? `No records match "${search}".`
                                : 'No records found. Use Save to add the first entry.'
                              : 'Select a Reference Type to load data.'}
                          </td>
                        </tr>
                      ) : (
                        displayed.flatMap((r, i) => {
                          const isSelected = editId === r.id
                          const isExpanded = expandedId === r.id
                          const rowBg = isSelected
                            ? 'bg-[#1565C0] text-white'
                            : i % 2 === 0
                            ? 'bg-white hover:bg-slate-50'
                            : 'bg-slate-50/50 hover:bg-slate-100/50'

                          const rows = [
                            <tr
                              key={r.id}
                              onClick={() => handleRowClick(r)}
                              className={`h-8 cursor-pointer text-[12px] transition-colors ${rowBg}`}
                            >
                              {/* Expand arrow */}
                              <td
                                className="px-2 py-1 border-r border-slate-100 text-center"
                                onClick={e => toggleExpand(r.id, e)}
                                title={isExpanded ? 'Collapse' : 'Expand'}
                              >
                                {isExpanded
                                  ? <ChevronDown size={12} className={`mx-auto ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                  : <ChevronRight size={12} className={`mx-auto ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                                }
                              </td>
                              {/* Code */}
                              <td className={`px-3 py-1 border-r border-slate-100 text-center font-bold ${isSelected ? '' : 'text-slate-600'}`}>
                                {r.code}
                              </td>
                              {/* Description */}
                              <td className={`px-3 py-1 border-r border-slate-100 truncate max-w-[320px] ${isSelected ? '' : 'text-slate-700'}`}>
                                {r.description}
                              </td>
                              {/* Updated By */}
                              <td className={`px-3 py-1 text-center font-semibold ${isSelected ? '' : 'text-[#0097A7]'}`}>
                                {r.updatedBy || 'Admin'}
                              </td>
                            </tr>
                          ]

                          if (isExpanded) {
                            rows.push(
                              <tr key={`expand-${r.id}`} className="bg-blue-50 border-b border-blue-100">
                                <td colSpan={4} className="px-6 py-2 text-[11px] text-slate-500">
                                  <div className="flex flex-wrap gap-x-6 gap-y-1">
                                    <span><span className="font-bold text-slate-600">ID:</span> {r.id}</span>
                                    <span><span className="font-bold text-slate-600">Type:</span> {r.referenceType}</span>
                                    {r.createdAt && (
                                      <span>
                                        <span className="font-bold text-slate-600">Created:</span>{' '}
                                        {new Date(r.createdAt).toLocaleString()}
                                      </span>
                                    )}
                                    {r.updatedAt && (
                                      <span>
                                        <span className="font-bold text-slate-600">Last Updated:</span>{' '}
                                        {new Date(r.updatedAt).toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )
                          }

                          return rows
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="border-t border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-500 flex items-center gap-4">
                  <span>Row : {displayed.length}</span>
                  {editId && selectedRecord && (
                    <span className="text-[#0097A7]">
                      ● Selected: [{selectedRecord.code}] {selectedRecord.description}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Add Reference Type Modal ─────────────────────────────── */}
      {showAddType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
          onClick={e => { if (e.target === e.currentTarget && !addTypeLoading) setShowAddType(false) }}
        >
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-80 overflow-hidden">
            <div className="flex items-center justify-between bg-[#0097A7] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Plus size={13} className="text-white" />
                <span className="text-[12px] font-bold text-white uppercase tracking-tight">Add Reference Type</span>
              </div>
              <button
                onClick={() => { if (!addTypeLoading) setShowAddType(false) }}
                disabled={addTypeLoading}
                className="text-white/80 hover:text-white transition-all disabled:opacity-50"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  <span className="text-red-600 mr-1">*</span>Type Name
                </label>
                <input
                  type="text"
                  value={newTypeName}
                  onChange={e => setNewTypeName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !addTypeLoading) handleAddType()
                    if (e.key === 'Escape' && !addTypeLoading) setShowAddType(false)
                  }}
                  autoFocus
                  disabled={addTypeLoading}
                  placeholder="e.g. Payment_Mode"
                  className="w-full px-2 py-[5px] text-[12px] border border-slate-300 rounded bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] disabled:opacity-60"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowAddType(false)}
                  disabled={addTypeLoading}
                  className="px-3 py-[5px] text-[11px] font-bold text-slate-600 border border-slate-300 rounded hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddType}
                  disabled={addTypeLoading}
                  className="flex items-center gap-1 px-3 py-[5px] text-[11px] font-bold text-white bg-[#0097A7] hover:bg-[#00838f] rounded transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {addTypeLoading
                    ? <><Loader2 size={11} className="animate-spin" /> Saving...</>
                    : <><Plus size={11} /> Create</>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ──────────────────────────────────── */}
      <ConfirmDialog
        open={confirmDelete}
        title="Confirm Delete"
        message={
          selectedRecord
            ? `Delete record [${selectedRecord.code}] "${selectedRecord.description}"? This action cannot be undone.`
            : 'Are you sure you want to delete this record? This action cannot be undone.'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
