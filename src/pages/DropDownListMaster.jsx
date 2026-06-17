import { useState } from 'react'
import {
  Plus, ArrowLeft, Pencil, Trash2, Info, Search,
  ChevronLeft, ChevronRight, ArrowUpDown, CheckCircle2, XCircle,
} from 'lucide-react'
import { useToast } from '../components/Toast'

// ── Seed data (mirrors screenshot rows) ──────────────────────────────────────
const DROPDOWN_NAMES = [
  'Account Type', 'Area', 'Bank', 'Brand', 'Category', 'Country', 'Currency',
  'Department', 'District', 'Division', 'Godown', 'Item Group', 'Item Type',
  'Location', 'Model', 'Payment Mode', 'Prefix', 'QC Type', 'Route',
  'State', 'Status', 'Store', 'Sub Group', 'Tax Ledger', 'UOM', 'Vehicle Type',
]

const SEED = [
  { id: 1, dropdownName: 'Account Type', dropdownList: 'ACCOUNTS', status: 'A' },
  { id: 2, dropdownName: 'Account Type', dropdownList: 'GODOWN', status: 'A' },
  { id: 3, dropdownName: 'Account Type', dropdownList: 'LIABILITIES', status: 'A' },
  { id: 4, dropdownName: 'Account Type', dropdownList: 'OTHER STAFF', status: 'A' },
  { id: 5, dropdownName: 'Account Type', dropdownList: 'BANK COLLECTION', status: 'A' },
  { id: 6, dropdownName: 'Area', dropdownList: 'Valasaraivakkam', status: 'A' },
  { id: 7, dropdownName: 'Area', dropdownList: 'Chennai', status: 'A' },
  { id: 8, dropdownName: 'Area', dropdownList: 'Kanchipuram', status: 'A' },
  { id: 9, dropdownName: 'Brand', dropdownList: 'FAG', status: 'A' },
  { id: 10, dropdownName: 'Brand', dropdownList: 'SKF', status: 'A' },
  { id: 11, dropdownName: 'Currency', dropdownList: 'INR', status: 'A' },
  { id: 12, dropdownName: 'Currency', dropdownList: 'USD', status: 'A' },
  { id: 13, dropdownName: 'UOM', dropdownList: 'NOS', status: 'A' },
  { id: 14, dropdownName: 'UOM', dropdownList: 'KG', status: 'A' },
  { id: 15, dropdownName: 'UOM', dropdownList: 'MTR', status: 'A' },
]

const PAGE_SIZES = [8, 25, 50, 100]

const emptyForm = { dropdownName: '', dropdownList: '' }

// ── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ row, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Drop Down List Details</h2>
          <button onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 rounded-full p-1 transition-colors">
            <XCircle size={20} />
          </button>
        </div>
        <div className="p-6 space-y-2">
          {[
            ['S.No.', row.id],
            ['Drop Down Name', row.dropdownName],
            ['Drop Down List', row.dropdownList],
            ['Status', row.status === 'A' ? 'Active' : 'Inactive'],
          ].map(([lbl, val]) => (
            <div key={lbl} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{lbl}</span>
              <span className="text-[13px] text-slate-800 font-medium">{val}</span>
            </div>
          ))}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <button onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DropDownListMaster() {
  const toast = useToast()
  const [rows, setRows] = useState(SEED)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(8)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  // ── Helpers ────────────────────────────────────────────────────────────────
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = () => {
    if (!form.dropdownName) return toast.warning('Drop Down Name is required')
    if (!form.dropdownList) return toast.warning('Drop Down List value is required')

    if (editId !== null) {
      setRows(r => r.map(x => x.id === editId
        ? { ...x, dropdownName: form.dropdownName, dropdownList: form.dropdownList }
        : x))
      setEditId(null)
    } else {
      const newId = Math.max(0, ...rows.map(r => r.id)) + 1
      setRows(r => [...r, { id: newId, dropdownName: form.dropdownName, dropdownList: form.dropdownList, status: 'A' }])
    }
    setForm(emptyForm)
    setPage(1)
  }

  const handleEdit = row => {
    setForm({ dropdownName: row.dropdownName, dropdownList: row.dropdownList })
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = id => {
    if (window.confirm('Delete this record?')) setRows(r => r.filter(x => x.id !== id))
  }

  const handleBackToList = () => { setForm(emptyForm); setEditId(null) }

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // ── Filter + Sort + Paginate ───────────────────────────────────────────────
  let filtered = rows.filter(r =>
    Object.values(r).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  )
  if (sortKey) {
    filtered = [...filtered].sort((a, b) => {
      const av = String(a[sortKey]).toLowerCase()
      const bv = String(b[sortKey]).toLowerCase()
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
    })
  }
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Renumber S.No. within paged view
  const startIdx = (page - 1) * pageSize

  // Compact group count by dropdownName for paged rows
  const groupCount = {}
  filtered.forEach(r => { groupCount[r.dropdownName] = (groupCount[r.dropdownName] || 0) + 1 })

  // ── UI helpers ─────────────────────────────────────────────────────────────
  const inputCls = 'w-full border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white'
  const selectCls = 'w-full border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white'

  const SortIcon = ({ col }) => (
    <ArrowUpDown size={11} className={`inline ml-1 ${sortKey === col ? 'text-[#0097A7]' : 'text-slate-400'}`} />
  )

  return (
    <div className="p-6 space-y-5 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer transition-colors">Item Masters</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Drop Down List Master</span>
      </div>

      {/* ── Create / Edit Form ──────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Drop Down List' : 'Create - Drop Down List'}
          </h2>
        </div>

        <div className="p-4 space-y-3">
          {/* Drop Down Name */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0">
              Drop Down Name :
            </label>
            <div className="flex-1 relative">
              <select
                value={form.dropdownName}
                onChange={e => setField('dropdownName', e.target.value)}
                className={selectCls}
              >
                <option value="">---Select---</option>
                {DROPDOWN_NAMES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Drop Down List */}
          <div className="flex items-center gap-3">
            <label className="text-[13px] font-semibold text-slate-700 w-36 shrink-0">
              Drop Down List :
            </label>
            <input
              type="text"
              value={form.dropdownList}
              onChange={e => setField('dropdownList', e.target.value)}
              placeholder="Enter drop down list value"
              className="flex-1 border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
            >
              <CheckCircle2 size={15} />
              {editId !== null ? 'Update' : 'Create'}
            </button>
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
            >
              <ArrowLeft size={15} />
              Back to List
            </button>
            {editId !== null && (
              <button
                onClick={() => { setForm(emptyForm); setEditId(null) }}
                className="px-4 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[13px] font-semibold rounded transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Data Table ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Drop Down List Details</h2>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <Search size={14} className="text-slate-400" />
            Search:
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40"
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
                <th className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide w-14">
                  S.No.
                </th>
                {[
                  { key: 'dropdownName', label: 'Drop Down Name' },
                  { key: 'dropdownList', label: 'Drop Down List' },
                  { key: 'status', label: 'Status' },
                ].map(({ key, label }) => (
                  <th
                    key={key}
                    onClick={() => handleSort(key)}
                    className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide cursor-pointer hover:bg-slate-100 transition-colors select-none"
                  >
                    {label}
                    <SortIcon col={key} />
                  </th>
                ))}
                {['Edit', 'Delete', 'Details'].map(h => (
                  <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide w-20">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400 text-[13px]">
                    No records found
                  </td>
                </tr>
              ) : paged.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-slate-100 hover:bg-[#f0f9fa] transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                >
                  <td className="px-3 py-2.5 text-center text-slate-500">{startIdx + idx + 1}</td>
                  <td className="px-3 py-2.5 text-center font-medium text-slate-700">{row.dropdownName}</td>
                  <td className="px-3 py-2.5 text-center text-slate-600">{row.dropdownList}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold tracking-wide
                      ${row.status === 'A' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleEdit(row)}
                      title="Edit"
                      className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors shadow-sm"
                    >
                      <Pencil size={13} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      title="Delete"
                      className="inline-flex items-center justify-center w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded transition-colors shadow-sm"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <button
                      onClick={() => setDetailRow(row)}
                      title="Details"
                      className="inline-flex items-center justify-center w-8 h-8 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors shadow-sm"
                    >
                      <Info size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={13} /> Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              // smart window around current page
              let n
              if (totalPages <= 7) n = i + 1
              else if (page <= 4) n = i + 1
              else if (page >= totalPages - 3) n = totalPages - 6 + i
              else n = page - 3 + i
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-8 h-8 text-[12px] rounded border transition-colors
                    ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
                >
                  {n}
                </button>
              )
            })}
            {totalPages > 7 && <span className="text-slate-400 text-[12px] px-1">…</span>}
            {totalPages > 7 && (
              <button
                onClick={() => setPage(totalPages)}
                className={`w-8 h-8 text-[12px] rounded border transition-colors
                  ${page === totalPages ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}
              >
                {totalPages}
              </button>
            )}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)} />}
    </div>
  )
}
