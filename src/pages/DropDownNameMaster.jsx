import { useState } from 'react'
import { X, Save, ArrowLeft, Plus, Edit, Trash2, Info, ChevronRight } from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Seed data (80 entries matching screenshot "Showing 1 to 8 of 80 entries") ──
const SEED_NAMES = [
  'State','Area','User Role','Discount Type','Status','Item Category','Tax Type','Ledger Type',
  'Payment Mode','Payment Terms','Bank Name','Account Type','Currency','Country','City',
  'Department','Designation','Employee Type','Shift','Leave Type','Expense Type','Vehicle Type',
  'Fuel Type','Service Type','Warranty Type','Complaint Type','Priority','Resolution Type',
  'Quotation Type','Purchase Type','Order Type','Delivery Type','Invoice Type','Receipt Type',
  'Debit Note Type','Credit Note Type','Journal Type','Document Type','Approval Status',
  'Rejection Reason','Inspection Type','Defect Type','Rework Type','Scrap Type','Asset Type',
  'Asset Category','Maintenance Type','Breakdown Type','Spare Type','Tool Type',
  'Material Type','Grade Type','Finish Type','Coating Type','Treatment Type','Test Type',
  'Certification Type','Standard Type','Specification Type','Drawing Type','Revision Type',
  'Approval Level','User Group','Permission Type','Report Type','Export Format','Import Format',
  'Notification Type','Alert Type','Reminder Type','Escalation Type','SLA Type','KPI Type',
  'Target Type','Measure Type','Rating Type','Feedback Type','Survey Type','Audit Type',
  'Risk Type','Control Type',
]

function makeSeed() {
  return SEED_NAMES.map((name, i) => ({ id: i + 1, name, status: 'A' }))
}

const PAGE_SIZES = [8, 10, 25, 50]

function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Drop Down Name Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-3">
          {[['ID', row.id], ['Drop Down Name', row.name], ['Status', row.status === 'A' ? 'Active' : 'Inactive']].map(([lbl, val]) => (
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

export default function DropDownNameMaster() {
  const toast = useToast()
  const [rows, setRows]         = useState(makeSeed)
  const [search, setSearch]     = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage]         = useState(1)
  const [detailRow, setDetailRow] = useState(null)

  // Form state — top "Create" section
  const [formName, setFormName]   = useState('')
  const [editId, setEditId]       = useState(null)   // null = create mode, number = edit mode
  const [showForm, setShowForm]   = useState(true)

  // ── Derived ──────────────────────────────────────────────────────
  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // ── Handlers ──────────────────────────────────────────────────────
  const handleCreate = () => {
    const trimmed = formName.trim()
    if (!trimmed) { toast.warning('Drop Down Name is required.'); return }

    if (editId !== null) {
      setRows(r => r.map(x => x.id === editId ? { ...x, name: trimmed } : x))
      setEditId(null)
    } else {
      const newId = Math.max(0, ...rows.map(r => r.id)) + 1
      setRows(r => [...r, { id: newId, name: trimmed, status: 'A' }])
    }
    setFormName('')
    setPage(1)
  }

  const handleEdit = row => {
    setFormName(row.name)
    setEditId(row.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = id => {
    if (window.confirm('Delete this record?')) {
      setRows(r => r.filter(x => x.id !== id))
      setPage(1)
    }
  }

  const handleBackToList = () => {
    setFormName('')
    setEditId(null)
    setShowForm(false)
  }

  const handleShowForm = () => setShowForm(true)

  const pageNums = () => {
    const nums = []
    // Show at most 10 page buttons, centered around current page
    const start = Math.max(1, Math.min(page - 4, totalPages - 9))
    const end   = Math.min(totalPages, start + 9)
    for (let i = start; i <= end; i++) nums.push(i)
    return nums
  }

  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Drop Down Name Master</span>
      </div>

      {/* ── Create / Edit form ── */}
      {showForm && (
        <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
          {/* Title bar */}
          <div className="bg-[--color-main] px-4 py-3 text-center">
            <h2 className="text-white font-semibold text-[14px]">
              {editId !== null ? 'Edit - Drop Down Name' : 'Create - Drop Down Name'}
            </h2>
          </div>

          {/* Form body */}
          <div className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <label className="text-[13px] font-semibold text-slate-700 whitespace-nowrap flex-shrink-0">
                <span className="text-red-500 mr-0.5">*</span>Drop Down Name :
              </label>
              <input
                type="text"
                value={formName}
                onChange={e => setFormName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                placeholder=""
                className="flex-1 px-3 py-[7px] text-sm border border-slate-300 rounded bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/30 focus:border-[#0097A7] transition-all"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                {editId !== null ? 'Update' : 'Create'}
              </button>
              <button
                onClick={handleBackToList}
                className="flex items-center gap-1.5 px-4 py-2 bg-[--color-main] hover:bg-[#2e86c1] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Table card ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">

        {/* Table title bar */}
        <div className="bg-[--color-main] px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px] flex-1 text-center">Drop Down Name Details</h2>
          {!showForm && (
            <button
              onClick={handleShowForm}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
               Create
            </button>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 gap-4">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            Search:
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-44"
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
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {['Drop Down Name', 'Status', 'Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-4 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">
                    {h}
                    {['Drop Down Name', 'Status'].includes(h) && (
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
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-[13px]">No records found</td></tr>
              ) : paged.map((row, idx) => (
                <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                  <td className="px-4 py-2.5 text-center">{row.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-bold
                      ${row.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      className="inline-flex items-center justify-center w-8 h-8 bg-slate-600 hover:bg-slate-700 text-white rounded transition-colors"
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

        {/* Footer / Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 gap-4 flex-wrap">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Previous</button>
            {pageNums().map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 text-[12px] rounded border transition-colors
                  ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
              >{n}</button>
            ))}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >Next</button>
          </div>
        </div>
      </div>

      {/* Detail modal */}
      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
