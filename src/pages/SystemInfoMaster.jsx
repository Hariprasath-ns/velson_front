import { useState, useEffect, useCallback } from 'react'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight } from 'lucide-react'
import api from '../services/api'

const PAGE_SIZES = [4, 10, 25, 50]
const empty = { DEPT: '', USERNAME: '', GateWay: '', IP: '', IPAddress: '', VelsonNo: '', MACAddress: '', DeviceName: '', Manufacturer: '' }

export default function SystemInfoMaster() {
  const [rows, setRows] = useState([])
  const [departments, setDepartments] = useState([])
  const [form, setForm] = useState({ ...empty })
  const [errors, setErrors] = useState({})
  const [editId, setEditId] = useState(null)
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(4)
  const [page, setPage] = useState(1)
  const [detailRow, setDetailRow] = useState(null)

  const fetchRows = useCallback(async () => {
    try {
      const res = await api.get('/api/system-info-master')
      setRows(res.data.data || [])
    } catch { setRows([]) }
  }, [])

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Department', { skipGlobalLoader: true })
      setDepartments((res.data.data || []).map(d => d.description))
    } catch { setDepartments([]) }
  }, [])

  useEffect(() => {
    fetchRows()
    fetchDepartments()
  }, [fetchRows, fetchDepartments])

  const sf = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const validate = () => {
    const e = {}
    if (!form.DEPT) e.DEPT = 'Required'
    if (!form.USERNAME.trim()) e.USERNAME = 'Required'
    setErrors(e); return !Object.keys(e).length
  }

  const toPayload = () => ({
    dept:         form.DEPT,
    userName:     form.USERNAME,
    gateWay:      form.GateWay,
    ip:           form.IP,
    ipAddress:    form.IPAddress,
    velsonNo:     form.VelsonNo,
    macAddress:   form.MACAddress,
    deviceName:   form.DeviceName,
    manufacturer: form.Manufacturer,
  })

  const fromRecord = (r) => ({
    DEPT:         r.dept         || '',
    USERNAME:     r.userName     || '',
    GateWay:      r.gateWay      || '',
    IP:           r.ip           || '',
    IPAddress:    r.ipAddress    || '',
    VelsonNo:     r.velsonNo     || '',
    MACAddress:   r.macAddress   || '',
    DeviceName:   r.deviceName   || '',
    Manufacturer: r.manufacturer || '',
    id:           r.id,
  })

  const handleSave = async () => {
    if (!validate()) return
    try {
      if (editId !== null) {
        await api.put(`/api/system-info-master/${editId}`, toPayload(), { loadingMessage: 'Updating...' })
        setEditId(null)
      } else {
        await api.post('/api/system-info-master', toPayload(), { loadingMessage: 'Saving...' })
      }
      setForm({ ...empty }); setErrors({}); setPage(1)
      await fetchRows()
    } catch (err) {
      alert(err.response?.data?.message || 'Save failed')
    }
  }

  const handleEdit = (r) => {
    setForm(fromRecord(r)); setErrors({}); setEditId(r.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return
    try {
      await api.delete(`/api/system-info-master/${id}`)
      await fetchRows()
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed')
    }
  }

  const handleClear = () => { setForm({ ...empty }); setErrors({}); setEditId(null) }

  const filtered = rows.filter(r =>
    [r.dept, r.userName, r.gateWay, r.ip, r.ipAddress, r.velsonNo, r.macAddress, r.deviceName, r.manufacturer]
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
  const inp = (e) => `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${e ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
  const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap'

  return (
    <div className="p-4 space-y-4 w-full min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span><ChevronRight className="w-3 h-3" />
        <span className="hover:text-[#0097A7] cursor-pointer">Masters</span><ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">System Info Master</span>
      </div>
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5"><h2 className="text-white text-center font-semibold text-[14px]">{editId !== null ? 'Edit' : 'Create'} — System Info Master</h2></div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            {/* Left column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}><span className="text-red-500">*</span>Department :</label>
                <div className="flex-1">
                  <select value={form.DEPT} onChange={e => sf('DEPT', e.target.value)} className={inp(errors.DEPT)}>
                    <option value="">---Select Department Name---</option>
                    {departments.map(d => <option key={d}>{d}</option>)}
                  </select>
                  {errors.DEPT && <p className="text-[11px] text-red-500 mt-0.5">{errors.DEPT}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}><span className="text-red-500">*</span>User Name :</label>
                <div className="flex-1">
                  <input value={form.USERNAME} onChange={e => sf('USERNAME', e.target.value)} className={inp(errors.USERNAME)} />
                  {errors.USERNAME && <p className="text-[11px] text-red-500 mt-0.5">{errors.USERNAME}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Gate Way :</label>
                <input value={form.GateWay} onChange={e => sf('GateWay', e.target.value)} placeholder="e.g. 192.168.1.1" className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>IP :</label>
                <input value={form.IP} onChange={e => sf('IP', e.target.value)} placeholder="e.g. 10.0.0.1" className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>IP Address :</label>
                <input value={form.IPAddress} onChange={e => sf('IPAddress', e.target.value)} placeholder="e.g. 192.168.1.100" className={inp(false)} />
              </div>
            </div>
            {/* Right column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Velson No :</label>
                <input value={form.VelsonNo} onChange={e => sf('VelsonNo', e.target.value)} placeholder="e.g. VSN-001" className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>MAC Address :</label>
                <input value={form.MACAddress} onChange={e => sf('MACAddress', e.target.value)} placeholder="e.g. AA:BB:CC:DD:EE:FF" className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Device Name :</label>
                <input value={form.DeviceName} onChange={e => sf('DeviceName', e.target.value)} placeholder="Network hostname" className={inp(false)} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-28 shrink-0`}>Manufacturer :</label>
                <input value={form.Manufacturer} onChange={e => sf('Manufacturer', e.target.value)} placeholder="e.g. Dell, HP, Lenovo" className={inp(false)} />
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-4 justify-end border-t border-slate-100 mt-4">
            <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"><Save className="w-4 h-4" />{editId !== null ? 'Update' : 'Create'}</button>
            <button onClick={handleClear} className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[13px] font-semibold rounded transition-colors shadow-sm"><RotateCcw className="w-4 h-4" />Clear</button>
            <button onClick={() => setPage(1)} className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-semibold rounded transition-colors shadow-sm"><List className="w-4 h-4" />Display All</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5"><h2 className="text-white text-center font-semibold text-[14px]">Velson Systems Information</h2></div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">Search:<input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="border border-slate-300 rounded px-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-40" /></div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600">Show<select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="border border-slate-300 rounded px-2 py-1 text-[13px]">{PAGE_SIZES.map(s => <option key={s}>{s}</option>)}</select>entries</div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="min-w-full text-[13px]">
            <thead><tr className="bg-slate-50 border-b border-slate-200">{['S.No', 'Department', 'User Name', 'Gate Way', 'IP', 'IP Address', 'Velson S.No.', 'MAC Address', 'Device Name', 'Manufacturer', 'Edit', 'Delete', 'Details'].map(h => <th key={h} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={13} className="text-center py-8 text-slate-400">No records found</td></tr>
                : paged.map((r, idx) => (
                  <tr key={r.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-3 py-2 text-center">{(page - 1) * pageSize + idx + 1}</td>
                    <td className="px-3 py-2 text-center font-medium">{r.dept}</td>
                    <td className="px-3 py-2 text-center">{r.userName}</td>
                    <td className="px-3 py-2 text-center font-mono text-[12px]">{r.gateWay}</td>
                    <td className="px-3 py-2 text-center font-mono text-[12px]">{r.ip}</td>
                    <td className="px-3 py-2 text-center font-mono text-[12px] text-[#0097A7]">{r.ipAddress}</td>
                    <td className="px-3 py-2 text-center font-semibold text-[#0097A7]">{r.velsonNo}</td>
                    <td className="px-3 py-2 text-center font-mono text-[11px]">{r.macAddress}</td>
                    <td className="px-3 py-2 text-center font-medium">{r.deviceName}</td>
                    <td className="px-3 py-2 text-center">{r.manufacturer}</td>
                    <td className="px-3 py-2 text-center"><button onClick={() => handleEdit(r)} className="px-3 py-1.5 bg-[--color-main] hover:bg-[#3498db] text-white text-[12px] rounded transition-colors"><Edit className="w-4 h-4" /></button></td>
                    <td className="px-3 py-2 text-center"><button onClick={() => handleDelete(r.id)} className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] rounded transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                    <td className="px-3 py-2 text-center"><button onClick={() => setDetailRow(r)} className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors"><Info className="w-4 h-4" /></button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">Previous</button>
            {pNums().map((n, i) => n === '...' ? <span key={`e${i}`} className="px-2 text-slate-400 text-[12px]">…</span> : <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>{n}</button>)}
            <button onClick={() => setPage(p => Math.min(total, p + 1))} disabled={page === total} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
      {detailRow && <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
          <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between"><h2 className="text-white font-bold text-[15px]">System Info Details</h2><button onClick={() => setDetailRow(null)} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button></div>
          <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-1.5">
            {[['Department', detailRow.dept], ['User Name', detailRow.userName], ['Gate Way', detailRow.gateWay], ['IP', detailRow.ip], ['IP Address', detailRow.ipAddress], ['Velson No', detailRow.velsonNo], ['MAC Address', detailRow.macAddress], ['Device Name', detailRow.deviceName], ['Manufacturer', detailRow.manufacturer]].map(([l, v]) => (
              <div key={l} className="flex flex-col py-1 border-b border-slate-100"><span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{l}</span><span className="text-[13px] text-slate-800 font-medium font-mono">{v || '—'}</span></div>
            ))}
          </div>
          <div className="px-6 pb-5 flex justify-end"><button onClick={() => setDetailRow(null)} className="px-5 py-2 text-sm font-semibold text-white bg-[#0097A7] hover:bg-[#007a87] rounded-lg transition-colors">Close</button></div>
        </div>
      </div>}
    </div>
  )
}
