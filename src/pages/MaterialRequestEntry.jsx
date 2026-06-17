import { useState, useEffect } from 'react'
import { ChevronRight, Plus, Trash2, Send, X, Search, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/LocalLoader'
import api from '../services/api'

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0]

const emptyItem = () => ({
  modelName:'', itemCode:'', itemName:'', requestedQty:'', materialGrade:'', unit:'', remarks:'',
})

const inp = (err='') =>
  `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

const fetchRefList = async (type) => {
  try {
    const res = await api.get(`/api/reference-master/${encodeURIComponent(type)}`, { skipGlobalLoader: true })
    return (res.data?.data || []).map(r => r.description).filter(Boolean)
  } catch {
    return []
  }
}

const LoadingSelect = ({ loading, value, onChange, className, children }) => (
  <div className="relative flex-1 min-w-0">
    <select
      value={value}
      onChange={onChange}
      disabled={loading}
      className={`${className} w-full ${loading ? 'opacity-60' : ''}`}
    >
      {children}
    </select>
    {loading && (
      <Loader2 size={11} className="animate-spin absolute right-7 top-1/2 -translate-y-1/2 text-[#0097A7] pointer-events-none" />
    )}
  </div>
)

export default function MaterialRequestEntry() {
  const toast = useToast()

  const [departments,   setDepartments]   = useState([])
  const [teams,         setTeams]         = useState([])
  const [requestingFor, setRequestingFor] = useState([])
  const [stores,        setStores]        = useState([])
  const [vehicleTypes,  setVehicleTypes]  = useState([])
  const [itemsData,     setItemsData]     = useState([])

  const [loading,     setLoading]     = useState(true)
  const [partImage,   setPartImage]   = useState(null)
  const [fetchingTmp, setFetchingTmp] = useState(false)
  const [loadedMrId,  setLoadedMrId]  = useState(null)
  const [nextMrNo,    setNextMrNo]    = useState('')

  const [form, setForm] = useState({
    tempRequestNo: '', departmentTo: '', requestingUser: 'superadmin',
    team: '', requestingFor: '', requestNo: '',
    requestDate: today, requiredDate: tomorrow, requiredDays: '',
    storeName: '', bomPartName: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    Promise.all([
      fetchRefList('Department'),
      fetchRefList('Team'),
      fetchRefList('Requesting_for_material'),
      fetchRefList('Store'),
      fetchRefList('Vehicle_Type'),
      api.get('/api/item-master?limit=10000', { skipGlobalLoader: true })
        .then(r => r.data?.data || [])
        .catch(() => []),
      api.get('/api/material-request/next-no', { skipGlobalLoader: true })
        .then(r => r.data?.mrNo || '')
        .catch(() => ''),
    ]).then(([depts, tms, reqFor, strs, vTypes, itms, mrNo]) => {
      setDepartments(depts)
      setTeams(tms)
      setRequestingFor(reqFor)
      setStores(strs)
      setVehicleTypes(vTypes)
      setItemsData(itms)
      setNextMrNo(mrNo)
      setForm(f => ({ ...f, requestNo: mrNo }))
    }).finally(() => setLoading(false))
  }, [])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setItemField = (idx, k, v) => {
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      if (k !== 'itemCode') return { ...r, [k]: v }
      const master = itemsData.find(it => it.partNo === v)
      setPartImage(master?.hasImage ? `/api/item-master/${master.id}/download-image` : (master?.imagePath || null))
      return {
        ...r,
        itemCode:      v,
        itemName:      master?.partName          || '',
        materialGrade: master?.materialGradeName || '',
        unit:          master?.uom || master?.uomName || '',
      }
    }))
  }

  const addRow = () => setItems(r => [...r, emptyItem()])
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  const loadTemplate = async () => {
    const no = form.tempRequestNo.trim()
    if (!no) return
    setFetchingTmp(true)
    try {
      const res = await api.get(`/api/material-request/by-no/${encodeURIComponent(no)}`, { skipGlobalLoader: true })
      const d = res.data?.data
      if (!d) { toast.error('Request not found'); return }

      setLoadedMrId(d.id)
      setForm(f => ({
        ...f,
        departmentTo:   d.departmentTo   || '',
        requestingUser: d.requestingUser || 'superadmin',
        team:           d.team           || '',
        requestingFor:  d.requestingFor  || '',
        requiredDays:   d.requiredDays   || '',
        storeName:      d.storeName      || '',
        bomPartName:    d.bomPartName    || '',
      }))
      setRemarks(d.remarks || '')

      if (d.details?.length) {
        setItems(d.details.map(det => ({
          modelName:     det.modelName     || '',
          itemCode:      det.itemCode      || '',
          itemName:      det.itemName      || '',
          requestedQty:  det.requestedQty != null ? String(det.requestedQty) : '',
          materialGrade: det.materialGrade || '',
          unit:          det.unit          || '',
          remarks:       det.remarks       || '',
        })))
      } else {
        setItems([emptyItem()])
      }
      toast.success(`Template loaded from ${no}`)
    } catch (err) {
      if (err.response?.status === 404) toast.error('Request not found')
      else toast.error('Failed to load request')
    } finally {
      setFetchingTmp(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        tempRequestNo:  form.tempRequestNo || null,
        departmentTo:   form.departmentTo,
        requestingUser: form.requestingUser,
        team:           form.team,
        requestingFor:  form.requestingFor,
        requestDate:    form.requestDate,
        requiredDate:   form.requiredDate,
        requiredDays:   form.requiredDays,
        storeName:      form.storeName,
        bomPartName:    form.bomPartName,
        remarks,
        status:    'Draft',
        createdBy: form.requestingUser || 'superadmin',
        items: items.filter(r => r.itemCode || r.itemName || r.modelName),
      }
      const res = await api.post('/api/material-request', payload)
      const created = res.data?.data
      toast.success(`Material Request ${created?.mrNo || ''} submitted!`)

      const nextRes = await api.get('/api/material-request/next-no', { skipGlobalLoader: true })
      const newMrNo = nextRes.data?.mrNo || ''
      setNextMrNo(newMrNo)
      setForm({
        tempRequestNo:'', departmentTo:'', requestingUser:'superadmin',
        team:'', requestingFor:'', requestNo: newMrNo,
        requestDate:today, requiredDate:tomorrow, requiredDays:'',
        storeName:'', bomPartName:'',
      })
      setItems([emptyItem()])
      setRemarks('')
      setPartImage(null)
      setLoadedMrId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submit failed')
    }
  }

  const handleCancel = () => {
    setForm({
      tempRequestNo:'', departmentTo:'', requestingUser:'superadmin',
      team:'', requestingFor:'', requestNo: nextMrNo,
      requestDate:today, requiredDate:tomorrow, requiredDays:'',
      storeName:'', bomPartName:'',
    })
    setItems([emptyItem()])
    setRemarks('')
    setPartImage(null)
    setLoadedMrId(null)
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Material Request</span>
      </div>

      {/* Main form card */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">Create - Material Request Entry</h2>
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">Close</button>
        </div>

        <div className="p-4 space-y-3">
          {/* 3-column header */}
          <div className="grid grid-cols-3 gap-4">

            {/* Column 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Temp Request No :</label>
                <div className="flex flex-1 gap-1">
                  <input
                    value={form.tempRequestNo}
                    onChange={e => setField('tempRequestNo', e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && loadTemplate()}
                    placeholder="Enter & press Enter or click"
                    className={inp()}
                  />
                  <button
                    onClick={loadTemplate}
                    disabled={fetchingTmp || !form.tempRequestNo.trim()}
                    title="Load template from this request"
                    className="px-2 py-1 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-40 text-white rounded transition-colors shrink-0"
                  >
                    <Search className="w-3.5 h-3.5"/>
                  </button>
                </div>
              </div>
              {loadedMrId && (
                <p className="text-[11px] text-emerald-600 pl-[138px]">Template loaded — all fields are editable.</p>
              )}
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Department To :</label>
                <LoadingSelect loading={loading} value={form.departmentTo} onChange={e => setField('departmentTo', e.target.value)} className={inp()}>
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d}>{d}</option>)}
                </LoadingSelect>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Requesting User :</label>
                <input value={form.requestingUser} readOnly className={`${inp()} bg-slate-50`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Team :</label>
                <LoadingSelect loading={loading} value={form.team} onChange={e => setField('team', e.target.value)} className={inp()}>
                  <option value="">Select Team</option>
                  {teams.map(t => <option key={t}>{t}</option>)}
                </LoadingSelect>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Requesting For :</label>
                <LoadingSelect loading={loading} value={form.requestingFor} onChange={e => setField('requestingFor', e.target.value)} className={inp()}>
                  <option value="">Select Requesting For</option>
                  {requestingFor.map(r => <option key={r}>{r}</option>)}
                </LoadingSelect>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Request No :</label>
                <div className="relative flex-1">
                  <input value={form.requestNo} readOnly className={`${inp()} bg-slate-50 w-full ${loading ? 'opacity-60' : ''}`} />
                  {loading && <Loader2 size={11} className="animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-[#0097A7] pointer-events-none" />}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Request Date :</label>
                <input type="date" value={form.requestDate} onChange={e => setField('requestDate', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Required Date :</label>
                <input type="date" value={form.requiredDate} onChange={e => setField('requiredDate', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Required Day's :</label>
                <input value={form.requiredDays} onChange={e => setField('requiredDays', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Store Name :</label>
                <LoadingSelect loading={loading} value={form.storeName} onChange={e => setField('storeName', e.target.value)} className={inp()}>
                  <option value="">Select Store</option>
                  {stores.map(s => <option key={s}>{s}</option>)}
                </LoadingSelect>
              </div>
            </div>

            {/* Column 3 — BOM + Image + buttons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>BOM Part Name :</label>
                <select value={form.bomPartName} onChange={e => setField('bomPartName', e.target.value)} className={inp()}>
                  <option value="">Select BOM Part Name</option>
                </select>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[120px] shrink-0 pt-1`}>Part Image :</label>
                <div className="flex-1 h-[60px] border border-slate-200 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
                  {partImage
                    ? <img src={partImage} alt="Part Preview" className="h-full w-full object-contain" />
                    : <span className="text-[11px] text-slate-400">Item Image</span>
                  }
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5"/> Add Row
                </button>
                <button onClick={() => { if(items.length>1) setItems(r => r.slice(0,-1)) }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm whitespace-nowrap">
                  <Trash2 className="w-3.5 h-3.5"/> Delete Selected Item
                </button>
              </div>
            </div>
          </div>

          {/* Items grid */}
          <div className="mt-2">
            <div className="bg-slate-700 px-3 py-1.5 rounded-t">
              <h3 className="text-white text-[13px] font-semibold">Items</h3>
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-b">
              {loading ? (
                <TableSkeleton rows={3} cols={['4%','14%','14%','16%','10%','12%','10%','10%','10%']} />
              ) : (
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">#</th>
                    {['Model Name','Item Code','Item Name','Requested Qty','Material Grade','Unit','Remarks','Action'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1">
                        <LoadingSelect loading={loading} value={row.modelName} onChange={e => setItemField(idx, 'modelName', e.target.value)} className={inp()}>
                          <option value="">Select</option>
                          {vehicleTypes.map(v => <option key={v}>{v}</option>)}
                        </LoadingSelect>
                      </td>
                      <td className="px-1 py-1">
                        <LoadingSelect loading={loading} value={row.itemCode} onChange={e => setItemField(idx, 'itemCode', e.target.value)} className={inp()}>
                          <option value="">Select Part No</option>
                          {itemsData.map(it => (
                            <option key={it.id} value={it.partNo}>{it.partNo}</option>
                          ))}
                        </LoadingSelect>
                      </td>
                      <td className="px-1 py-1"><input value={row.itemName} readOnly className={`${inp()} bg-slate-50 min-w-[150px]`} /></td>
                      <td className="px-1 py-1"><input value={row.requestedQty} onChange={e=>setItemField(idx,'requestedQty',e.target.value)} className={inp()} /></td>
                      <td className="px-1 py-1"><input value={row.materialGrade} readOnly className={`${inp()} bg-slate-50`} /></td>
                      <td className="px-1 py-1"><input value={row.unit} onChange={e=>setItemField(idx,'unit',e.target.value)} className={`${inp()} w-16`} /></td>
                      <td className="px-1 py-1"><input value={row.remarks} onChange={e=>setItemField(idx,'remarks',e.target.value)} className={inp()} /></td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeRow(idx)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              )}
            </div>
          </div>

          {/* Remarks + Submit/Cancel */}
          <div className="flex items-start gap-4 pt-2">
            <label className={`${lbl} w-[100px] shrink-0 pt-1`}>Remark's :</label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white" />
          </div>
          <div className="flex gap-2 justify-center pt-1">
            <button onClick={handleSubmit} className="flex items-center gap-1 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
              <Send className="w-3.5 h-3.5"/> Submit
            </button>
            <button onClick={handleCancel} className="flex items-center gap-1 px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
              <X className="w-3.5 h-3.5"/> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
