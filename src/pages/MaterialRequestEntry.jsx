import { useState, useEffect } from 'react'
import { ChevronRight, Plus, Trash2, Send, X, Search, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { TableSkeleton } from '../components/LocalLoader'
import api from '../services/api'
import { useReferenceMaster, useVehicles } from '../hooks/useMasterData'
import ItemSearchInput from '../components/ItemSearchInput'
import { useMemo } from 'react'

const today = new Date().toISOString().split('T')[0]
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const getDaysDiff = (requiredDate, requestDate) => {
  if (!requiredDate || !requestDate) return ''
  const req = new Date(requiredDate)
  const reqst = new Date(requestDate)
  req.setHours(0, 0, 0, 0)
  reqst.setHours(0, 0, 0, 0)
  const diffTime = req - reqst
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return isNaN(diffDays) ? '' : String(diffDays)
}

const getRequiredDateFromDays = (requestDate, days) => {
  if (!requestDate || days === '' || isNaN(days)) return ''
  const parts = requestDate.split('-')
  if (parts.length !== 3) return ''
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)
  const date = new Date(year, month, day)
  date.setDate(date.getDate() + parseInt(days, 10))
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const emptyItem = () => ({
  modelName: '', itemCode: '', itemName: '', requestedQty: '', materialGrade: '', unit: '', remarks: '',
})

const inp = (err = '') =>
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

  // React Query master data fetches
  const { data: deptsData = [], isLoading: deptsLoading } = useReferenceMaster('Department')
  const { data: teamsData = [], isLoading: teamsLoading } = useReferenceMaster('Team')
  const { data: reqForData = [], isLoading: reqForLoading } = useReferenceMaster('Requesting_for_material')
  const { data: storesData = [], isLoading: storesLoading } = useReferenceMaster('Store')
  const { data: vTypesData = [], isLoading: vTypesLoading } = useReferenceMaster('Vehicle_Type')
  const { data: vehiclesRes = [], isLoading: vehiclesLoading } = useVehicles()

  const departments = useMemo(() => deptsData.map(r => r.description).filter(Boolean), [deptsData])
  const teams = useMemo(() => teamsData.map(r => r.description).filter(Boolean), [teamsData])
  const requestingFor = useMemo(() => reqForData.map(r => r.description).filter(Boolean), [reqForData])
  const stores = useMemo(() => storesData.map(r => r.description).filter(Boolean), [storesData])
  const vehicleTypes = useMemo(() => vTypesData.map(r => r.description).filter(Boolean), [vTypesData])

  const vehicleNames = useMemo(() => {
    return [...new Set([
      ...vehiclesRes.map(v => v.vehicleName).filter(Boolean),
      'Rig A', 'Rig B', 'Rig C', 'Rig D', 'Rig E', 'Rig F', 'Rig G', 'NEW FABRICATION', 'KOBELCO'
    ])]
  }, [vehiclesRes])

  const [loading, setLoading] = useState(true)
  const [partImage, setPartImage] = useState(null)
  const [fetchingTmp, setFetchingTmp] = useState(false)
  const [loadedMrId, setLoadedMrId] = useState(null)
  const [nextMrNo, setNextMrNo] = useState('')
  const [approvedList, setApprovedList] = useState([])
  const [showApprovedModal, setShowApprovedModal] = useState(false)
  const [approvedSearch, setApprovedSearch] = useState('')
  const [loadingApproved, setLoadingApproved] = useState(false)

  const [form, setForm] = useState({
    tempRequestNo: '', departmentTo: '', requestingUser: 'superadmin',
    team: '', requestingFor: '', requestNo: '',
    requestDate: today, requiredDate: tomorrow, requiredDays: '1',
    storeName: '', bomPartName: '', vehicleName: '',
  })
  const [items, setItems] = useState([emptyItem()])
  const [remarks, setRemarks] = useState('')

  useEffect(() => {
    const fetchNextMrNo = async () => {
      try {
        const res = await api.get('/api/material-request/next-no', { skipGlobalLoader: true })
        const mrNo = res.data?.mrNo || ''
        setNextMrNo(mrNo)
        setForm(f => ({ ...f, requestNo: mrNo }))
      } catch (err) {
        console.error('Failed to fetch next MR number:', err)
      } finally {
        setLoading(false)
      }
    }
    if (!deptsLoading && !teamsLoading && !reqForLoading && !storesLoading && !vTypesLoading && !vehiclesLoading) {
      fetchNextMrNo()
    }
  }, [deptsLoading, teamsLoading, reqForLoading, storesLoading, vTypesLoading, vehiclesLoading])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const fetchItemMasterByCode = async (itemCode) => {
    if (!itemCode) return null
    try {
      const res = await api.get(`/api/item-master?search=${encodeURIComponent(itemCode)}&limit=1`, { skipGlobalLoader: true })
      const itms = res.data?.data || []
      return itms.find(it => it.partNo === itemCode) || itms[0] || null
    } catch (err) {
      console.error(`Failed to fetch master info for itemCode ${itemCode}:`, err)
      return null
    }
  }

  const handleItemSelect = async (idx, val, item) => {
    let resolvedItem = item
    if (!resolvedItem && val && val.trim().length > 0) {
      try {
        resolvedItem = await fetchItemMasterByCode(val.trim())
      } catch {
        resolvedItem = null
      }
    }

    if (val) {
      const isDuplicate = items.some((r, i) => i !== idx && r.itemCode === val)
      if (isDuplicate) {
        toast.error('This item is already added')
        return
      }
    }

    if (resolvedItem) {
      const hasImg = resolvedItem.hasImage || !!resolvedItem.imageMimeType
      if (hasImg) {
        setPartImage(`/api/item-master/${resolvedItem.id}/download-image`)
      } else if (resolvedItem.imagePath) {
        setPartImage(resolvedItem.imagePath.startsWith('http') || resolvedItem.imagePath.startsWith('/') ? resolvedItem.imagePath : `/uploads/${resolvedItem.imagePath}`)
      } else {
        setPartImage(null)
      }
    } else if (items.every((l, i) => i === idx || !l.itemCode)) {
      setPartImage(null)
    }

    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      if (!resolvedItem) {
        return { ...r, itemCode: val }
      }
      return {
        ...r,
        itemCode: resolvedItem.partNo || val || '',
        itemName: resolvedItem.partName || '',
        materialGrade: resolvedItem.materialGradeName || '',
        unit: resolvedItem.uom || resolvedItem.uomName || '',
      }
    }))
  }

  const setItemField = (idx, k, v) => {
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      return { ...r, [k]: v }
    }))
  }

  const addRow = () => setItems(r => [...r, emptyItem()])
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  const openApprovedModal = async () => {
    setShowApprovedModal(true)
    setLoadingApproved(true)
    try {
      const res = await api.get('/api/material-request?limit=10000', { skipGlobalLoader: true })
      const all = res.data?.data || []
      const approvedOnly = all.filter(r => r.status === 'Approved')
      setApprovedList(approvedOnly)
    } catch {
      toast.error('Failed to load approved material requests')
    } finally {
      setLoadingApproved(false)
    }
  }

  const handleSelectApprovedMR = async (mr) => {
    if (!mr) return
    setLoadedMrId(mr.id)
    setForm(f => ({
      ...f,
      tempRequestNo: mr.mrNo || '',
      departmentTo: mr.departmentTo || '',
      requestingUser: mr.requestingUser || 'superadmin',
      team: mr.team || '',
      requestingFor: mr.requestingFor || '',
      requiredDays: mr.requiredDays || '',
      storeName: mr.storeName || '',
      bomPartName: mr.bomPartName || '',
      vehicleName: mr.vehicleName || '',
    }))
    setRemarks(mr.remarks || '')

    if (mr.details?.length) {
      setItems(mr.details.map(det => ({
        modelName: det.modelName || '',
        itemCode: det.itemCode || '',
        itemName: det.itemName || '',
        requestedQty: det.requestedQty != null ? String(det.requestedQty) : '',
        materialGrade: det.materialGrade || '',
        unit: det.unit || '',
        remarks: det.remarks || '',
      })))
      if (mr.details[0]?.itemCode) {
        const itm = await fetchItemMasterByCode(mr.details[0].itemCode)
        if (itm) {
          const hasImg = itm.hasImage || !!itm.imageMimeType
          if (hasImg) {
            setPartImage(`/api/item-master/${itm.id}/download-image`)
          } else if (itm.imagePath) {
            setPartImage(itm.imagePath.startsWith('http') || itm.imagePath.startsWith('/') ? itm.imagePath : `/uploads/${itm.imagePath}`)
          }
        }
      }
    } else {
      setItems([emptyItem()])
    }
    toast.success(`Approved Request ${mr.mrNo} loaded`)
    setShowApprovedModal(false)
  }

  const loadTemplate = async () => {
    const no = form.tempRequestNo.trim()
    if (!no) {
      openApprovedModal()
      return
    }
    setFetchingTmp(true)
    try {
      const res = await api.get(`/api/material-request/by-no/${encodeURIComponent(no)}`, { skipGlobalLoader: true })
      const d = res.data?.data
      if (!d) { toast.error('Request not found'); return }
      if (d.status !== 'Approved') {
        toast.warning(`Request ${no} is not approved (Status: ${d.status || 'Pending'})`)
        return
      }
      handleSelectApprovedMR(d)
    } catch (err) {
      if (err.response?.status === 404) toast.error('Approved request not found')
      else toast.error('Failed to load request')
    } finally {
      setFetchingTmp(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const payload = {
        tempRequestNo: form.tempRequestNo || null,
        departmentTo: form.departmentTo,
        requestingUser: form.requestingUser,
        team: form.team,
        requestingFor: form.requestingFor,
        requestDate: form.requestDate,
        requiredDate: form.requiredDate,
        requiredDays: form.requiredDays,
        storeName: form.storeName,
        bomPartName: form.bomPartName,
        vehicleName: form.vehicleName,
        remarks,
        status: 'Pending',
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
        tempRequestNo: '', departmentTo: '', requestingUser: 'superadmin',
        team: '', requestingFor: '', requestNo: newMrNo,
        requestDate: today, requiredDate: tomorrow, requiredDays: '1',
        storeName: '', bomPartName: '', vehicleName: '',
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
      tempRequestNo: '', departmentTo: '', requestingUser: 'superadmin',
      team: '', requestingFor: '', requestNo: nextMrNo,
      requestDate: today, requiredDate: tomorrow, requiredDays: '1',
      storeName: '', bomPartName: '', vehicleName: '',
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
        <ChevronRight className="w-3 h-3" />
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
                <label className={`${lbl} w-[130px] shrink-0 cursor-pointer`} onClick={openApprovedModal}>Existing Request No :</label>
                <div className="flex flex-1 gap-1">
                  <input
                    value={form.tempRequestNo}
                    onChange={e => setField('tempRequestNo', e.target.value)}
                    onClick={openApprovedModal}
                    onKeyDown={e => e.key === 'Enter' && loadTemplate()}
                    placeholder="Click to select approved MR..."
                    className={`${inp()} cursor-pointer bg-white`}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={openApprovedModal}
                    title="Select Approved Material Request"
                    className="px-2.5 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white rounded transition-colors shrink-0 flex items-center gap-1 text-[12px] font-medium shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" /> Select
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
              {/* <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Requesting User :</label>
                <input value={form.requestingUser} readOnly className={`${inp()} bg-slate-50`} />
              </div> */}
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
                <input type="date" value={form.requestDate} onChange={e => setField('requestDate', e.target.value)} className={inp()} readOnly />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Required Date :</label>
                <input
                  type="date"
                  value={form.requiredDate}
                  onChange={e => {
                    const rDate = e.target.value
                    setForm(f => ({
                      ...f,
                      requiredDate: rDate,
                      requiredDays: getDaysDiff(rDate, f.requestDate),
                    }))
                  }}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Required Day's :</label>
                <input
                  type="text"
                  value={form.requiredDays}
                  onChange={e => {
                    const days = e.target.value
                    if (days === '' || /^\d+$/.test(days)) {
                      setForm(f => ({
                        ...f,
                        requiredDays: days,
                        requiredDate: getRequiredDateFromDays(f.requestDate, days),
                      }))
                    }
                  }}
                  placeholder="Required Days"
                  className={inp()}
                />
              </div>
              {/* <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Store Name :</label>
                <LoadingSelect loading={loading} value={form.storeName} onChange={e => setField('storeName', e.target.value)} className={inp()}>
                  <option value="">Select Store</option>
                  {stores.map(s => <option key={s}>{s}</option>)}
                </LoadingSelect>
              </div> */}
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Vehicle Name:</label>
                <input
                  value={form.vehicleName}
                  onChange={e => setField('vehicleName', e.target.value)}
                  placeholder="Enter Vehicle Name"
                  className={inp()}
                />
              </div>
            </div>

            {/* Column 3 — BOM + Image + buttons */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[120px] shrink-0 pt-1`}>Part Image :</label>
                <div className="flex-1 h-[120px] border border-slate-200 rounded bg-slate-50 flex items-center justify-center overflow-hidden">
                  {partImage
                    ? <img src={partImage} alt="Part Preview" className="h-full w-full object-contain" />
                    : <span className="text-[11px] text-slate-400">Item Image</span>
                  }
                </div>
              </div>
              <div className="flex gap-2 pt-1 justify-end">
                <button onClick={addRow} className="flex items-center gap-1 px-2 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5" /> Add Row
                </button>
                <button onClick={() => { if (items.length > 1) setItems(r => r.slice(0, -1)) }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm whitespace-nowrap">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Selected Item
                </button>
              </div>
            </div>
          </div>

          {/* Items grid */}
          <div className="mt-2">
            <div className="bg-slate-700 px-3 py-1.5 rounded-t">
              <h3 className="text-white text-[13px] font-semibold">Items</h3>
            </div>
            <div className="border border-slate-200 rounded-b overflow-visible relative z-30 shadow-sm">
              {loading ? (
                <TableSkeleton rows={3} cols={['4%', '14%', '14%', '16%', '10%', '12%', '10%', '10%', '10%']} />
              ) : (
                <table className="min-w-full text-[12.5px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">S.NO</th>
                      {['Model Name', 'Item Code', 'Item Name', 'Material Grade', 'Requested Qty', 'Unit', 'Remarks', 'Action'].map(h => (
                        <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row, idx) => (
                      <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''} relative`} style={{ zIndex: items.length - idx + 10 }}>
                        <td className="px-2 py-1 text-center text-slate-500">{idx + 1}</td>
                        <td className="px-1 py-1 w-32">
                          <LoadingSelect loading={loading} value={row.modelName} onChange={e => setItemField(idx, 'modelName', e.target.value)} className={inp()}>
                            <option value="">Select</option>
                            {vehicleTypes.map(v => <option key={v}>{v}</option>)}
                          </LoadingSelect>
                        </td>
                        <td className="px-1 py-1 w-36 min-w-[150px]">
                          <ItemSearchInput
                            value={row.itemCode}
                            onChange={(val, item) => handleItemSelect(idx, val, item)}
                            displayField="partNo"
                            placeholder="Search Part No..."
                            className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7] font-semibold text-[#0097A7]"
                          />
                        </td>
                        <td className="px-1 py-1"><input value={row.itemName} readOnly className={`${inp()} bg-slate-50 min-w-[150px] cursor-not-allowed`} /></td>
                        <td className="px-1 py-1"><input value={row.materialGrade} readOnly className={`${inp()} bg-slate-50 w-28 cursor-not-allowed`} /></td>
                        <td className="px-1 py-1"><input value={row.requestedQty} onChange={e => setItemField(idx, 'requestedQty', e.target.value)} className={`${inp()} w-20 text-right font-medium`} /></td>
                        <td className="px-1 py-1"><input value={row.unit} readOnly className={`${inp()} bg-slate-50 w-16 text-center cursor-not-allowed`} /></td>
                        <td className="px-1 py-1"><input value={row.remarks} onChange={e => setItemField(idx, 'remarks', e.target.value)} className={inp()} /></td>
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
            <label className={`${lbl} w-[100px] shrink-0 pt-1`}>Note :</label>
            <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white" />
          </div>
          <div className="flex gap-2 justify-center pt-1">
            <button onClick={handleSubmit} className="flex items-center gap-1 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
              <Send className="w-3.5 h-3.5" /> Submit
            </button>
            <button onClick={handleCancel} className="flex items-center gap-1 px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
              <X className="w-3.5 h-3.5" /> Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Modal to Select Approved Material Request */}
      {showApprovedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                <h3 className="text-[13px] font-bold uppercase tracking-wide">Select Approved Material Request</h3>
              </div>
              <button onClick={() => setShowApprovedModal(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <span className="text-[12px] font-bold text-slate-600">Search:</span>
                <input
                  value={approvedSearch}
                  onChange={e => setApprovedSearch(e.target.value)}
                  placeholder="Search by MR No, Department, User, Vehicle..."
                  className="w-full border border-slate-300 rounded px-3 py-1.5 text-[12px] bg-white focus:outline-none focus:border-[#0097A7]"
                  autoFocus
                />
              </div>
              <span className="text-[11.5px] font-semibold text-slate-500">
                {approvedList.filter(r => {
                  if (!approvedSearch.trim()) return true
                  const q = approvedSearch.toLowerCase()
                  return (
                    (r.mrNo || '').toLowerCase().includes(q) ||
                    (r.departmentTo || '').toLowerCase().includes(q) ||
                    (r.requestingUser || '').toLowerCase().includes(q) ||
                    (r.vehicleName || '').toLowerCase().includes(q)
                  )
                }).length} Approved Requests
              </span>
            </div>

            {/* Modal Table */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingApproved ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-7 h-7 text-[#0097A7] animate-spin" />
                  <span className="text-[12px] text-slate-500 font-semibold">Loading approved requests...</span>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-[12px] border-collapse">
                    <thead className="bg-slate-100 text-slate-700 text-[11px] uppercase font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 text-center w-12">#</th>
                        <th className="px-3 py-2">Request No</th>
                        <th className="px-3 py-2 text-center">Req Date</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2">Requesting For</th>
                        <th className="px-3 py-2">Vehicle Name</th>
                        <th className="px-3 py-2 text-center">Status</th>
                        <th className="px-3 py-2 text-center w-24">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {approvedList
                        .filter(r => {
                          if (!approvedSearch.trim()) return true
                          const q = approvedSearch.toLowerCase()
                          return (
                            (r.mrNo || '').toLowerCase().includes(q) ||
                            (r.departmentTo || '').toLowerCase().includes(q) ||
                            (r.requestingUser || '').toLowerCase().includes(q) ||
                            (r.vehicleName || '').toLowerCase().includes(q)
                          )
                        })
                        .map((mr, idx) => (
                          <tr
                            key={mr.id}
                            onClick={() => handleSelectApprovedMR(mr)}
                            className="hover:bg-[#f0fdfe] cursor-pointer transition-colors"
                          >
                            <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-bold text-[#0097A7]">{mr.mrNo}</td>
                            <td className="px-3 py-2 text-center text-slate-500">
                              {mr.requestDate ? new Date(mr.requestDate).toLocaleDateString('en-GB') : '—'}
                            </td>
                            <td className="px-3 py-2 font-medium text-slate-700">{mr.departmentTo || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{mr.requestingFor || '—'}</td>
                            <td className="px-3 py-2 text-slate-600">{mr.vehicleName || '—'}</td>
                            <td className="px-3 py-2 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                Approved
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => handleSelectApprovedMR(mr)}
                                className="px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded shadow-xs transition-colors"
                              >
                                Select
                              </button>
                            </td>
                          </tr>
                        ))}
                      {approvedList.filter(r => {
                        if (!approvedSearch.trim()) return true
                        const q = approvedSearch.toLowerCase()
                        return (
                          (r.mrNo || '').toLowerCase().includes(q) ||
                          (r.departmentTo || '').toLowerCase().includes(q) ||
                          (r.requestingUser || '').toLowerCase().includes(q) ||
                          (r.vehicleName || '').toLowerCase().includes(q)
                        )
                      }).length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                            No approved material requests found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowApprovedModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold text-[12px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
