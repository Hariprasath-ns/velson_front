import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Plus, Trash2, X, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useLoading } from '../context/LoadingContext'
import api from '../services/api'

const today = new Date().toISOString().split('T')[0]
const BASE = 'http://localhost:3000'

// Module-level cache — survives re-mounts (e.g. return from pick) but not page refresh
let _ddCache = null

const emptyItem = () => ({ itemId: null, code: '', itemName: '', specification: '', jobNo: '', machineNo: '', unit: '', qty: '', eta: '', qcDept: '', purpose: '', selected: false })

const inp = (err = '') =>
  `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

const FieldLoader = ({ loading, children, className = '' }) => (
  <div className={`relative flex-1 ${className}`}>
    {children}
    {loading && (
      <span className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0097A7]" />
      </span>
    )}
  </div>
)

export default function PurchaseRequestEntry() {
  const toast = useToast()
  const { show: showLoader, hide: hideLoader } = useLoading()
  const [form, setForm] = useState({
    department: '', departmentId: null, requestingUser: 'admin',
    team: '', teamId: null, requestingFor: '', requestingForId: null,
    requestNo: '', financialYear: '', requestDate: today, requiredDate: today,
    remarks: ''
  })
  const [items, setItems] = useState([emptyItem()])
  const [departments, setDepartments]             = useState([])
  const [teams, setTeams]                         = useState([])
  const [requestingForOpts, setRequestingForOpts] = useState([])
  const [itemsData, setItemsData]                 = useState([])
  const [loading, setLoading]                     = useState(true)
  const [submitting, setSubmitting]               = useState(false)
  const [editId, setEditId]                       = useState(null)
  const initDone = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const load = async () => {
      setLoading(true)

      // Capture both flags synchronously before any async work
      const editRaw  = localStorage.getItem('velson:pr-edit')
      const editIdVal = editRaw ? parseInt(editRaw, 10) : null
      if (editRaw) localStorage.removeItem('velson:pr-edit')

      const mrPickId = window.__velsonMrPickId ?? null
      if (mrPickId) window.__velsonMrPickId = null

      try {
        // MR pick fetch always starts in parallel — regardless of cache state
        const mrPickPromise = mrPickId
          ? api.get(`/api/material-request/${mrPickId}`, { skipGlobalLoader: true })
              .then(r => r.data?.data ?? null)
              .catch(() => null)
          : Promise.resolve(null)

        let dj, tj, rj, ij

        if (_ddCache) {
          // Return from pick — reuse cached dropdowns, only fetch next-no
          ;({ dj, tj, rj, ij } = _ddCache)
          setDepartments(dj.data)
          setTeams(tj.data)
          setRequestingForOpts(rj.data)
          setItemsData(ij.data)
        } else {
          // First load — fetch everything in parallel
          const [dRes, tRes, rRes, iRes] = await Promise.all([
            fetch(`${BASE}/api/reference-master/Department`),
            fetch(`${BASE}/api/reference-master/Team`),
            fetch(`${BASE}/api/reference-master/Requesting_for_purchase`),
            fetch(`${BASE}/api/item-master?limit=10000`),
          ])
          ;[dj, tj, rj, ij] = await Promise.all([dRes.json(), tRes.json(), rRes.json(), iRes.json()])
          if (dj.success) setDepartments(dj.data)
          if (tj.success) setTeams(tj.data)
          if (rj.success) setRequestingForOpts(rj.data)
          if (ij.success) setItemsData(ij.data)
          _ddCache = { dj, tj, rj, ij }
        }

        const [nRes, mr] = await Promise.all([
          fetch(`${BASE}/api/purchase-request/next-no`).then(r => r.json()),
          mrPickPromise,
        ])
        const nj = nRes

        if (mrPickId) {
          if (nj.success) setForm(f => ({ ...f, requestNo: nj.prNo, financialYear: nj.financialYear }))
          if (mr) {
            const deptRec = dj.success ? dj.data.find(d => d.description === mr.departmentTo) : null
            const rfRec   = rj.success ? rj.data.find(r => r.description === mr.requestingFor) : null
            setForm(f => ({
              ...f,
              department:      mr.departmentTo   || '',
              departmentId:    deptRec?.id        ?? null,
              requestingUser:  mr.requestingUser  || f.requestingUser,
              requestingFor:   mr.requestingFor   || '',
              requestingForId: rfRec?.id           ?? null,
              requiredDate:    mr.requiredDate ? mr.requiredDate.split('T')[0] : f.requiredDate,
              remarks:         mr.remarks || '',
            }))
            if (mr.details?.length > 0) {
              const itemsList = ij.success ? ij.data : []
              setItems(mr.details.map(d => {
                const matched = itemsList.find(i => i.partNo === d.itemCode)
                return {
                  itemId:        matched?.id     ?? null,
                  code:          d.itemCode      || '',
                  itemName:      d.itemName      || matched?.partName || '',
                  specification: d.materialGrade || matched?.description || '',
                  jobNo:         d.modelName     || '',
                  machineNo:     '',
                  unit:          d.unit          || '',
                  qty:           String(d.requestedQty ?? ''),
                  eta:           '',
                  qcDept:        '',
                  purpose:       d.remarks       || '',
                  selected:      false,
                }
              }))
            }
          }
        } else if (editIdVal) {
          setEditId(editIdVal)
          const prRes = await fetch(`${BASE}/api/purchase-request/${editIdVal}`)
          const prJson = await prRes.json()
          if (prJson.success && prJson.data) {
            const pr = prJson.data
            setForm(f => ({
              ...f,
              requestNo:      pr.prNo,
              financialYear:  pr.financialYear,
              requestDate:    pr.prDate     ? pr.prDate.split('T')[0]     : today,
              requiredDate:   pr.requiredDate ? pr.requiredDate.split('T')[0] : today,
              department:     pr.department     || '',
              departmentId:   pr.departmentId   ?? null,
              requestingUser: pr.requestingUser || 'admin',
              team:           pr.team           || '',
              teamId:         pr.teamId         ?? null,
              requestingFor:  pr.requestingFor  || '',
              requestingForId: pr.requestingForId ?? null,
              remarks:        pr.remarks        || '',
            }))
            if (pr.details?.length > 0) {
              setItems(pr.details.map(d => ({
                itemId:        d.itemId    || null,
                code:          d.itemCode  || '',
                itemName:      d.itemName  || '',
                specification: d.specification || '',
                jobNo:         d.jobNo     || '',
                machineNo:     d.machineNo || '',
                unit:          d.uom       || '',
                qty:           String(d.qty ?? ''),
                eta:           d.eta ? d.eta.split('T')[0] : '',
                qcDept:        '',
                purpose:       d.purpose   || '',
                selected:      false,
              })))
            }
          }
        } else {
          if (nj.success) setForm(f => ({ ...f, requestNo: nj.prNo, financialYear: nj.financialYear }))
        }
      } catch (err) {
        console.error('Failed to load dropdown data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const setItemField = (idx, k, v) =>
    setItems(rows => rows.map((r, i) => (i === idx ? { ...r, [k]: v } : r)))

  const handleDeptChange = (e) => {
    const rec = departments.find(d => d.description === e.target.value)
    setForm(f => ({ ...f, department: e.target.value, departmentId: rec?.id ?? null }))
  }

  const handleTeamChange = (e) => {
    const rec = teams.find(t => t.description === e.target.value)
    setForm(f => ({ ...f, team: e.target.value, teamId: rec?.id ?? null }))
  }

  const handleRequestingForChange = (e) => {
    const rec = requestingForOpts.find(r => r.description === e.target.value)
    setForm(f => ({ ...f, requestingFor: e.target.value, requestingForId: rec?.id ?? null }))
  }

  const handleItemCodeChange = (idx, code) => {
    const item = itemsData.find(i => i.partNo === code)
    setItems(rows => rows.map((r, i) => i !== idx ? r : {
      ...r,
      itemId: item?.id ?? null,
      code:          code,
      itemName:      item?.partName    ?? '',
      specification: item?.description ?? '',
    }))
  }

  const addRow = () => setItems(r => [...r, emptyItem()])
  const deleteSelected = () => setItems(r => r.filter(row => !row.selected))
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  const fetchNextNo = async () => {
    try {
      const res = await fetch(`${BASE}/api/purchase-request/next-no`)
      const j = await res.json()
      if (j.success) setForm(f => ({ ...f, requestNo: j.prNo, financialYear: j.financialYear }))
    } catch (err) {
      console.error('Failed to fetch next PR no:', err)
    }
  }

  const handleSubmit = async () => {
    if (!form.department) {
      toast?.error ? toast.error('Department is required') : alert('Department is required')
      return
    }
    setSubmitting(true)
    showLoader(editId ? 'Updating purchase request...' : 'Submitting purchase request...')
    try {
      const mappedItems = items
        .filter(r => r.code)
        .map(r => ({
          itemId:        r.itemId,
          itemCode:      r.code,
          itemName:      r.itemName,
          specification: r.specification,
          jobNo:         r.jobNo,
          machineNo:     r.machineNo,
          uom:           r.unit,
          qty:           r.qty,
          eta:           r.eta || null,
          purpose:       r.purpose,
        }))

      if (editId) {
        // ── Update existing PR ──
        const payload = {
          prDate:        form.requestDate,
          requiredDate:  form.requiredDate,
          department:    form.department,
          departmentId:  form.departmentId,
          requestingUser: form.requestingUser,
          team:          form.team,
          teamId:        form.teamId,
          requestingFor:   form.requestingFor,
          requestingForId: form.requestingForId,
          remarks:         form.remarks,
          status:          'Draft',
          updatedBy:       form.requestingUser || 'Admin',
          items:           mappedItems,
        }
        const res = await fetch(`${BASE}/api/purchase-request/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const j = await res.json()
        if (j.success) {
          toast?.success ? toast.success(`Purchase request ${form.requestNo} updated!`) : alert('Updated!')
          window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PrintPurchaseRequest' } }))
        } else {
          toast?.error ? toast.error(j.message || 'Update failed') : alert(j.message || 'Update failed')
        }
      } else {
        // ── Create new PR ──
        const payload = {
          prNo:          form.requestNo,
          financialYear: form.financialYear,
          prDate:        form.requestDate,
          requiredDate:  form.requiredDate,
          department:    form.department,
          departmentId:  form.departmentId,
          requestingUser: form.requestingUser,
          team:          form.team,
          teamId:        form.teamId,
          requestingFor:   form.requestingFor,
          requestingForId: form.requestingForId,
          remarks:         form.remarks,
          status:          'Draft',
          createdBy:       form.requestingUser,
          items:           mappedItems,
        }
        const res = await fetch(`${BASE}/api/purchase-request`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const j = await res.json()
        if (j.success) {
          toast?.success ? toast.success(`Purchase request ${form.requestNo} submitted!`) : alert('Submitted!')
          setForm(f => ({ ...f, department: '', departmentId: null, team: '', teamId: null, requestingFor: '', requestingForId: null, remarks: '', requestDate: today, requiredDate: today }))
          setItems([emptyItem()])
          await fetchNextNo()
        } else {
          toast?.error ? toast.error(j.message || 'Submit failed') : alert(j.message || 'Submit failed')
        }
      }
    } catch (err) {
      console.error('Submit error:', err)
      toast?.error ? toast.error('Network error — please try again') : alert('Network error')
    } finally {
      setSubmitting(false)
      hideLoader()
    }
  }

  const handleCancel = () => {
    if (editId) {
      window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PrintPurchaseRequest' } }))
    } else {
      setForm(f => ({ ...f, department: '', departmentId: null, team: '', teamId: null, requestingFor: '', requestingForId: null, remarks: '', requestDate: today, requiredDate: today }))
      setItems([emptyItem()]) 
    }
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3" /> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Purchase</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">Purchase Request Entry</span>
      </div>

      {/* Main form card */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[#0097A7] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">
            {editId ? 'Edit - Purchase Request Entry' : 'Create - Purchase Request Entry'}
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={handleCancel} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> {editId ? 'Back' : 'Close'}
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0 text-red-500`}>* Department:</label>
                <FieldLoader loading={loading}>
                  <select value={form.department} onChange={handleDeptChange} disabled={loading} className={`${inp()} ${loading ? 'pr-8 text-slate-400' : ''}`}>
                    <option value="">{loading ? 'Loading…' : 'Select Department'}</option>
                    {!loading && departments.map(d => <option key={d.id} value={d.description}>{d.description}</option>)}
                  </select>
                </FieldLoader>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Requesting User:</label>
                <input value={form.requestingUser} disabled className={`${inp()} bg-slate-100 text-slate-500`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Team:</label>
                <FieldLoader loading={loading}>
                  <select value={form.team} onChange={handleTeamChange} disabled={loading} className={`${inp()} ${loading ? 'pr-8 text-slate-400' : ''}`}>
                    <option value="">{loading ? 'Loading…' : 'Select Team'}</option>
                    {!loading && teams.map(t => <option key={t.id} value={t.description}>{t.description}</option>)}
                  </select>
                </FieldLoader>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Requesting For:</label>
                <FieldLoader loading={loading}>
                  <select value={form.requestingFor} onChange={handleRequestingForChange} disabled={loading} className={`${inp()} ${loading ? 'pr-8 text-slate-400' : ''}`}>
                    <option value="">{loading ? 'Loading…' : 'Select Requesting For'}</option>
                    {!loading && requestingForOpts.map(r => <option key={r.id} value={r.description}>{r.description}</option>)}
                  </select>
                </FieldLoader>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 justify-end">
                <label className={`${lbl} w-[100px] shrink-0 text-right`}>Request No:</label>
                <FieldLoader loading={loading} className="!flex-none w-[200px]">
                  <input value={form.requestNo} disabled placeholder={loading ? 'Generating…' : ''} className={`${inp()} w-[200px] bg-slate-100 text-slate-500 ${loading ? 'pr-8' : ''}`} />
                </FieldLoader>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <label className={`${lbl} w-[100px] shrink-0 text-right`}>Request Date:</label>
                <FieldLoader loading={loading} className="!flex-none w-[200px]">
                  <input type="date" value={form.requestDate} onChange={e => setField('requestDate', e.target.value)} disabled={loading} className={`${inp()} w-[200px] ${loading ? 'bg-slate-100 pr-8' : ''}`} />
                </FieldLoader>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <label className={`${lbl} w-[100px] shrink-0 text-right`}>Required Date:</label>
                <FieldLoader loading={loading} className="!flex-none w-[200px]">
                  <input type="date" value={form.requiredDate} onChange={e => setField('requiredDate', e.target.value)} disabled={loading} className={`${inp()} w-[200px] ${loading ? 'bg-slate-100 pr-8' : ''}`} />
                </FieldLoader>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.__velsonMrPickMode = true
                    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PrintMaterialRequest' } }))
                  }}
                  className="text-blue-600 text-[12.5px] hover:underline font-medium"
                >
                  Pick From Material Request
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3 px-4 pb-2">
          <button onClick={addRow} disabled={loading || submitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-medium rounded shadow-sm transition-colors">
            <Plus className="w-3.5 h-3.5" /> Add Row
          </button>
          <button onClick={deleteSelected} disabled={loading || submitting} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[12px] font-medium rounded shadow-sm transition-colors">
            <Trash2 className="w-3.5 h-3.5" /> Delete Selected Item
          </button>
        </div>

        {/* Items Grid */}
        <div className="px-4 pb-4">
          <div className="overflow-x-auto border border-slate-200 rounded-md bg-white shadow-sm">
            <table className="min-w-full text-[12px]">
              <thead className="bg-slate-800">
                <tr>
                  <th className="p-2 text-center text-white w-8"><input type="checkbox" className="accent-[#0097A7]" /></th>
                  <th className="p-2 text-center text-white w-8">#</th>
                  {['Code', 'Item Name', 'Specification', 'Job No', 'Machine No', 'Unit', 'Qty', 'ETA', 'QC Dept', 'Purpose', 'Action'].map(h => (
                    <th key={h} className="p-2 text-left font-medium text-white whitespace-nowrap border-l border-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="p-1.5 text-center border-r border-slate-100">
                      <input type="checkbox" checked={row.selected} onChange={e => setItemField(idx, 'selected', e.target.checked)} className="accent-[#0097A7] w-3.5 h-3.5" />
                    </td>
                    <td className="p-1.5 text-center text-slate-500 border-r border-slate-100 font-medium bg-slate-50">{idx + 1}</td>
                    <td className="p-1.5 min-w-[140px] border-r border-slate-100">
                      <FieldLoader loading={loading}>
                        <select value={row.code} onChange={e => handleItemCodeChange(idx, e.target.value)} disabled={loading || submitting} className={`${inp()} ${loading ? 'pr-8 text-slate-400' : ''}`}>
                          <option value="">{loading ? 'Loading…' : 'Select Code'}</option>
                          {!loading && itemsData.map(i => <option key={i.id} value={i.partNo}>{i.partNo}</option>)}
                        </select>
                      </FieldLoader>
                    </td>
                    <td className="p-1.5 min-w-[150px] border-r border-slate-100"><input value={row.itemName} readOnly className={`${inp()} bg-slate-50 text-slate-600`} /></td>
                    <td className="p-1.5 min-w-[180px] border-r border-slate-100"><input value={row.specification} readOnly className={`${inp()} bg-slate-50 text-slate-600`} /></td>
                    <td className="p-1.5 min-w-[80px] border-r border-slate-100"><input value={row.jobNo} onChange={e => setItemField(idx, 'jobNo', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[80px] border-r border-slate-100"><input value={row.machineNo} onChange={e => setItemField(idx, 'machineNo', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[60px] border-r border-slate-100"><input value={row.unit} onChange={e => setItemField(idx, 'unit', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[60px] border-r border-slate-100"><input value={row.qty} onChange={e => setItemField(idx, 'qty', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[100px] border-r border-slate-100"><input type="date" value={row.eta} onChange={e => setItemField(idx, 'eta', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[80px] border-r border-slate-100"><input value={row.qcDept} onChange={e => setItemField(idx, 'qcDept', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 min-w-[100px] border-r border-slate-100"><input value={row.purpose} onChange={e => setItemField(idx, 'purpose', e.target.value)} className={inp()} /></td>
                    <td className="p-1.5 text-center">
                      <button onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700 text-[11px] font-medium underline">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-start justify-between p-4 border-t border-slate-200 bg-slate-50/50">
          <div className="flex items-start gap-2 w-1/2">
            <label className={`${lbl} pt-1`}>Remarks:</label>
            <textarea rows="2" value={form.remarks} onChange={e => setField('remarks', e.target.value)} className={`${inp()} resize-none`} />
          </div>
          <button onClick={handleSubmit} disabled={loading || submitting} className="px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[13px] font-bold rounded shadow-sm transition-colors mt-2">
            {editId ? 'Update Request' : 'Submit For Approval'}
          </button>
        </div>
      </div>
    </div>
  )
}