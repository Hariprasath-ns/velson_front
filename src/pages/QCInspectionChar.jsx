import { useState } from 'react'
import { X, Edit, Trash2, Info, ChevronRight } from 'lucide-react'

const PAGE_SIZES = [4, 10, 25, 50]
const empty = {
  itemType: '', brand: '', partNo: '', partName: '', model: '',
  rmChar: '', tolerance: '', minValue: '', text: '', checkMethod: '',
  specification: '', uom: '', maxValue: '', equal: '', orderNo: ''
}
const ITEM_TYPES = ['Raw Material', 'Finished Good', 'Semi-Finished', 'Consumable']
const RM_CHARS = ['Dimensional', 'Visual', 'Chemical', 'Mechanical', 'Electrical']
const CHECK_METHODS = ['Measurement', 'Visual Inspection', 'Testing', 'Sampling']
const UOM_TYPES = ['mm', 'cm', 'kg', 'g', 'pcs', '%', 'HRC', 'Ra']

const SEED = [
  { id: 1, docNo: 'DOC-001', revNo: 'R1', revDated: '2024-01-10', spec: 'SP-01', characteristics: 'Dimensional', specification: 'ISO 286', checkMethod: 'Measurement', specType: 'Tolerance', instrument: 'Vernier', uom: 'mm', min: '0.1', max: '0.5', equal: '', text: '', orderNo: '1', createdBy: 'Admin' },
  { id: 2, docNo: 'DOC-002', revNo: 'R2', revDated: '2024-02-15', spec: 'SP-02', characteristics: 'Visual', specification: 'IS 2062', checkMethod: 'Visual Inspection', specType: 'Pass/Fail', instrument: 'Eye', uom: 'pcs', min: '', max: '', equal: 'Pass', text: 'No cracks', orderNo: '2', createdBy: 'QC1' },
  { id: 3, docNo: 'DOC-003', revNo: 'R1', revDated: '2024-03-20', spec: 'SP-03', characteristics: 'Mechanical', specification: 'ASTM A36', checkMethod: 'Testing', specType: 'Range', instrument: 'Hardness Tester', uom: 'HRC', min: '58', max: '62', equal: '', text: '', orderNo: '3', createdBy: 'QC2' },
  { id: 4, docNo: 'DOC-004', revNo: 'R3', revDated: '2024-04-05', spec: 'SP-04', characteristics: 'Chemical', specification: 'DIN 17100', checkMethod: 'Sampling', specType: 'Percentage', instrument: 'Spectrometer', uom: '%', min: '0.2', max: '0.4', equal: '', text: 'C content', orderNo: '4', createdBy: 'Admin' },
]

export default function QCInspectionChar() {
  const [rows, setRows] = useState(SEED)
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(4)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }
  const validate = () => {
    const e = {}
    if (!form.itemType) e.itemType = 'Required'
    if (!form.partNo.trim()) e.partNo = 'Required'
    if (!form.rmChar) e.rmChar = 'Required'
    if (!form.checkMethod) e.checkMethod = 'Required'
    setErrors(e)
    return !Object.keys(e).length
  }
  const handleSave = () => {
    if (!validate()) return
    const docNo = `DOC-${String(Math.max(0, ...rows.map(r => parseInt(r.docNo.split('-')[1] || 0))) + 1).padStart(3, '0')}`
    if (editId !== null) {
      setRows(r => r.map(x => x.id === editId ? { ...x, ...formToRow(form, x.docNo, x.revNo, x.revDated, x.createdBy) } : x))
      setEditId(null)
    } else {
      const id = Math.max(0, ...rows.map(r => r.id)) + 1
      setRows(r => [...r, { id, ...formToRow(form, docNo, 'R1', new Date().toISOString().slice(0, 10), 'Admin') }])
    }
    setForm({ ...empty }); setErrors({}); setPage(1)
  }
  const formToRow = (f, docNo, revNo, revDated, createdBy) => ({
    docNo, revNo, revDated, spec: f.specification, characteristics: f.rmChar,
    specification: f.specification, checkMethod: f.checkMethod, specType: f.itemType,
    instrument: '', uom: f.uom, min: f.minValue, max: f.maxValue,
    equal: f.equal, text: f.text, orderNo: f.orderNo, createdBy
  })
  const handleEdit = r => {
    setForm({
      itemType: r.specType || '', brand: '', partNo: r.docNo, partName: '', model: '',
      rmChar: r.characteristics || '', tolerance: '', minValue: r.min, text: r.text,
      checkMethod: r.checkMethod, specification: r.specification, uom: r.uom,
      maxValue: r.max, equal: r.equal, orderNo: r.orderNo
    })
    setErrors({}); setEditId(r.id); window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const handleDelete = id => { if (window.confirm('Delete this record?')) setRows(r => r.filter(x => x.id !== id)) }
  const handleClear = () => { setForm({ ...empty }); setErrors({}); setEditId(null) }
  const filtered = rows.filter(r =>
    [r.docNo, r.characteristics, r.specification, r.checkMethod, r.createdBy]
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
    ps.push(total); return ps
  }

  const inp = (err) => `w-full border rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 transition-colors bg-white h-7 ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
  const sel = (err) => `w-full border rounded px-1 py-0 text-[12px] focus:outline-none focus:ring-1 transition-colors bg-white h-7 ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
  const lbl = 'text-[12px] font-medium text-slate-700 whitespace-nowrap'
  const req = <span className="text-red-500">*</span>

  const cols = ['ID', 'DocNo', 'RevNo', 'Revdated', 'Spec', 'Characteristics', 'Specification', 'CheckMethod', 'SpecificationType', 'Instrument', 'UOM', 'Min', 'Max', 'Equal', 'Text', 'OrderNo', 'CreatedBy', 'Edit', 'Delete', 'Details']

  return (
    <div className="p-4 space-y-4 w-full min-w-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span>
        <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Quality Control</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Material Inspection Standard</span>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <h2 className="text-center text-[#0097A7] font-bold text-[15px] py-3 border-b border-slate-200">
          Material Inspection Standard Details
        </h2>
        <div className="p-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Panel 1 */}
            <div className="border border-[#4a9fd4] rounded p-3 space-y-2">
              {/* Item Type + Brand */}
              <div className="grid grid-cols-2 gap-2 items-center">
                <div>
                  <label className={lbl}>{req}Item Type :</label>
                  <select value={form.itemType} onChange={e => sf('itemType', e.target.value)} className={sel(errors.itemType)}>
                    <option value="">----Item Type----</option>
                    {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  {errors.itemType && <p className="text-[10px] text-red-500">{errors.itemType}</p>}
                </div>
                <div>
                  <label className={lbl}>Brand :</label>
                  <input value={form.brand} onChange={e => sf('brand', e.target.value)} className={inp(false)} />
                </div>
              </div>
              {/* Part No */}
              <div>
                <label className={lbl}>{req}Part No :</label>
                <input value={form.partNo} onChange={e => sf('partNo', e.target.value)} className={inp(errors.partNo)} />
                {errors.partNo && <p className="text-[10px] text-red-500">{errors.partNo}</p>}
              </div>
              {/* Part Name + Model */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Part Name :</label>
                  <input value={form.partName} onChange={e => sf('partName', e.target.value)} className={inp(false)} />
                </div>
                <div>
                  <label className={lbl}>Model :</label>
                  <input value={form.model} onChange={e => sf('model', e.target.value)} className={inp(false)} />
                </div>
              </div>
              {/* RM Characteristics */}
              <div>
                <label className={lbl}>{req}RM Characteristics :</label>
                <select value={form.rmChar} onChange={e => sf('rmChar', e.target.value)} className={sel(errors.rmChar)}>
                  <option value="">---Characteristics Type---</option>
                  {RM_CHARS.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.rmChar && <p className="text-[10px] text-red-500">{errors.rmChar}</p>}
              </div>
            </div>

            {/* Panel 2 */}
            <div className="border border-[#4a9fd4] rounded p-3 space-y-2">
              {/* Tolerance + Min Value */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Tolerance :</label>
                  <input value={form.tolerance} onChange={e => sf('tolerance', e.target.value)} className={inp(false)} />
                </div>
                <div>
                  <label className={lbl}>Min value :</label>
                  <input value={form.minValue} onChange={e => sf('minValue', e.target.value)} className={inp(false)} />
                </div>
              </div>
              {/* Text */}
              <div>
                <label className={lbl}>Text :</label>
                <input value={form.text} onChange={e => sf('text', e.target.value)} className={inp(false)} />
              </div>
              {/* Check Method */}
              <div>
                <label className={lbl}>{req}Check Method :</label>
                <select value={form.checkMethod} onChange={e => sf('checkMethod', e.target.value)} className={sel(errors.checkMethod)}>
                  <option value="">---Check Method Type---</option>
                  {CHECK_METHODS.map(c => <option key={c}>{c}</option>)}
                </select>
                {errors.checkMethod && <p className="text-[10px] text-red-500">{errors.checkMethod}</p>}
              </div>
              {/* Specification + UOM */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Specification :</label>
                  <input value={form.specification} onChange={e => sf('specification', e.target.value)} className={inp(false)} />
                </div>
                <div>
                  <label className={lbl}>UOM :</label>
                  <select value={form.uom} onChange={e => sf('uom', e.target.value)} className={sel(false)}>
                    <option value="">---UOM Type---</option>
                    {UOM_TYPES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Panel 3 */}
            <div className="border border-[#4a9fd4] rounded p-3 space-y-2">
              {/* Max Value + Equal */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={lbl}>Max value :</label>
                  <input value={form.maxValue} onChange={e => sf('maxValue', e.target.value)} className={inp(false)} />
                </div>
                <div>
                  <label className={lbl}>Equal :</label>
                  <input value={form.equal} onChange={e => sf('equal', e.target.value)} className={inp(false)} />
                </div>
              </div>
              {/* Inspection Order */}
              <div>
                <label className={lbl}>Inspection Order :</label>
                <input value={form.orderNo} onChange={e => sf('orderNo', e.target.value)} className={inp(false)} />
              </div>
              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSave} className="flex-1 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors">
                  {editId !== null ? 'Update' : 'Create'}
                </button>
                <button onClick={handleClear} className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded transition-colors">
                  Clear
                </button>
                <button onClick={() => setPage(1)} className="flex-1 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors">
                  Display All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#4a9fd4] px-4 py-2">
          <h2 className="text-white text-center font-semibold text-[13px]">QC Material Inspection Standard Master Details</h2>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            Search:
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="border border-slate-300 rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36" />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            Show
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
              className="border border-slate-300 rounded px-1 py-0.5 text-[12px]">
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {cols.map(h => (
                  <th key={h} className="text-center px-2 py-2 font-semibold text-slate-600 text-[11px] uppercase tracking-wide whitespace-nowrap border-r border-slate-100 last:border-r-0">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={cols.length} className="text-center py-8 text-slate-400">No records found</td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-2 py-1.5 text-center">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-2 py-1.5 text-center font-medium text-[#0097A7] whitespace-nowrap">{r.docNo}</td>
                    <td className="px-2 py-1.5 text-center">{r.revNo}</td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">{r.revDated}</td>
                    <td className="px-2 py-1.5 text-center">{r.spec}</td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">{r.characteristics}</td>
                    <td className="px-2 py-1.5 text-center">{r.specification}</td>
                    <td className="px-2 py-1.5 text-center whitespace-nowrap">{r.checkMethod}</td>
                    <td className="px-2 py-1.5 text-center">{r.specType}</td>
                    <td className="px-2 py-1.5 text-center">{r.instrument}</td>
                    <td className="px-2 py-1.5 text-center">{r.uom}</td>
                    <td className="px-2 py-1.5 text-center">{r.min}</td>
                    <td className="px-2 py-1.5 text-center">{r.max}</td>
                    <td className="px-2 py-1.5 text-center">{r.equal}</td>
                    <td className="px-2 py-1.5 text-center max-w-[80px] truncate">{r.text}</td>
                    <td className="px-2 py-1.5 text-center">{r.orderNo}</td>
                    <td className="px-2 py-1.5 text-center">{r.createdBy}</td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => handleEdit(r)} className="px-2 py-1 bg-[#4a9fd4] hover:bg-[#3a8fc4] text-white rounded transition-colors">
                        <Edit className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => handleDelete(r.id)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                    <td className="px-2 py-1.5 text-center">
                      <button onClick={() => setDetailRow(r)} className="px-2 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors">
                        <Info className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200">
          <span className="text-[11px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1 text-[11px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Previous
            </button>
            {pNums().map((n, i) =>
              n === '...'
                ? <span key={`e${i}`} className="px-2 text-slate-400 text-[11px]">…</span>
                : <button key={n} onClick={() => setPage(n)}
                  className={`w-7 h-7 text-[11px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>
                  {n}
                </button>
            )}
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total}
              className="px-3 py-1 text-[11px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {detailRow && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-[14px]">Inspection Standard Details</h2>
              <button onClick={() => setDetailRow(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-1.5">
              {[
                ['Doc No', detailRow.docNo], ['Rev No', detailRow.revNo],
                ['Rev Dated', detailRow.revDated], ['Spec', detailRow.spec],
                ['Characteristics', detailRow.characteristics], ['Specification', detailRow.specification],
                ['Check Method', detailRow.checkMethod], ['Spec Type', detailRow.specType],
                ['Instrument', detailRow.instrument], ['UOM', detailRow.uom],
                ['Min', detailRow.min], ['Max', detailRow.max],
                ['Equal', detailRow.equal], ['Text', detailRow.text],
                ['Order No', detailRow.orderNo], ['Created By', detailRow.createdBy],
              ].map(([l, v]) => (
                <div key={l} className="flex flex-col py-1 border-b border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span>
                  <span className="text-[12px] text-slate-800 font-medium">{v || '—'}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <button onClick={() => setDetailRow(null)}
                className="px-5 py-1.5 text-[13px] font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
