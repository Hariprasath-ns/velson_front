import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useReferenceMaster, useCustomers, useVehicles } from '../hooks/useMasterData'
import { useMemo } from 'react'
import { X, Save, RotateCcw, List, Edit, Trash2, Info, ChevronRight, Loader2 } from 'lucide-react'
import { TableSkeleton, SpinnerLoader } from '../components/LocalLoader'
import { useToast } from '../components/Toast'

const BOM_MODELS = ['BOM-V10-001', 'BOM-V10-002', 'BOM-V20-001', 'BOM-CON-001', 'BOM-VT-001']
const PAGE_SIZES = [5, 10, 25, 50]

const today = new Date().toISOString().split('T')[0]

const emptyForm = {
  entryDate: today,
  customerId: '',
  vehicleCount: '1',
  address: '',
  vehicleNumber: '',
  modelName: '',
  modelSubType: '',
  vehicleName: '',
  serialNumber: '',
  bomType: 'New',
  bomModelNumber: '',
  remarks: '',
}

// ── Serial number generator ───────────────────────────────────────────────────

function generateSerialNumber(modelCode, entryDate, existingRows) {
  const date = new Date(entryDate)
  const MM = String(date.getMonth() + 1).padStart(2, '0')
  const YY = String(date.getFullYear()).slice(-2)
  const prefix = `${modelCode}/${MM}${YY}`
  const maxSeq = existingRows.reduce((max, r) => {
    if (!r.serialNumber?.startsWith(prefix)) return max
    const seq = parseInt(r.serialNumber.slice(prefix.length), 10) || 0
    return Math.max(max, seq)
  }, 0)
  return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`
}

// ── Detail Modal ─────────────────────────────────────────────────────────────

function DetailModal({ row, onClose }) {
  const dateStr = row.entryDate
    ? new Date(row.entryDate).toLocaleDateString('en-GB')
    : '—'
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Vehicle Master Details</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-5 space-y-1.5 max-h-[70vh] overflow-y-auto">
          {[
            ['Date',              dateStr],
            ['Customer Name',     row.customer?.customerName],
            ['Customer Code',     row.customer?.cCode],
            ['Address',           row.address],
            ['Vehicle Count',     row.vehicleCount],
            ['Vehicle Number',    row.vehicleNumber],
            ['Model Name',        row.modelName],
            ['Sub Model Type',    row.modelSubType],
            ['Vehicle Name',      row.vehicleName],
            ['Serial Number',     row.serialNumber],
            ['B.O.M. Type',       row.bomType],
            ['B.O.M. Model No.',  row.bomModelNumber],
            ['Remarks',           row.remarks],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
              <span className="text-[12px] font-semibold text-slate-500 uppercase tracking-wider">{l}</span>
              <span className="text-[13px] text-slate-800 font-medium">{v || '—'}</span>
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

// ── Confirm Delete Modal ─────────────────────────────────────────────────────

function ConfirmDeleteModal({ customerName, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-red-500 px-6 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px]">Confirm Delete</h2>
          <button onClick={onCancel} disabled={loading} className="text-white/80 hover:text-white"><X className="w-5 h-5"/></button>
        </div>
        <div className="p-6">
          <p className="text-[13px] text-slate-700">
            Are you sure you want to delete the vehicle record for{' '}
            <span className="font-semibold">{customerName}</span>? This action cannot be undone.
          </p>
        </div>
        <div className="px-6 pb-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 text-[13px] font-semibold text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-3.5 h-3.5 animate-spin"/>}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function VehicleMaster() {
  const toast = useToast()
  const { data: vehicleTypesData = [] } = useReferenceMaster('Vehicle_Type')
  const { data: subTypesData = [] } = useReferenceMaster('Vehicle_Sub_Type')
  const { data: bNamesData = [] } = useReferenceMaster('Booking_Vehicle_Name')
  const { data: customersRes = [] } = useCustomers()
  const { data: vehiclesRes = [], refetch: refetchVehicles, isLoading: isVehiclesLoading } = useVehicles()

  const [rows, setRows] = useState([])
  useEffect(() => {
    if (vehiclesRes) {
      setRows(vehiclesRes)
    }
  }, [vehiclesRes])

  const customers = customersRes
  const modelNameOptions = useMemo(() => vehicleTypesData.map(r => r.description).filter(Boolean), [vehicleTypesData])
  const modelSubTypeOptions = useMemo(() => subTypesData.map(r => r.description).filter(Boolean), [subTypesData])
  const vehicleNameOptions = useMemo(() => bNamesData.map(r => r.description).filter(Boolean), [bNamesData])

  const [form, setForm]               = useState(emptyForm)
  const [errors, setErrors]           = useState({})
  const [editId, setEditId]           = useState(null)
  const [search, setSearch]           = useState('')
  const [pageSize, setPageSize]       = useState(5)
  const [page, setPage]               = useState(1)
  const [detailRow, setDetailRow]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  // Loading states
  const loadingList = isVehiclesLoading
  const loadingCustomers = false
  const loadingRefData = false
  const [loadingSave, setLoadingSave]           = useState(false)
  const [loadingDelete, setLoadingDelete]       = useState(false)

  const selectedCustomer = customers.find(c => c.id === Number(form.customerId)) || null



  // ── Form helpers ──

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: '' }))
  }

  const handleCustomerChange = (customerId) => {
    const customerRows = rows.filter(r => r.customerId === Number(customerId))
    const maxCount = customerRows.reduce((max, r) => Math.max(max, Number(r.vehicleCount) || 0), 0)
    const cust = customers.find(c => c.id === Number(customerId))
    setForm(f => ({
      ...f,
      customerId,
      vehicleCount: String(maxCount + 1),
      address: cust?.address || ''
    }))
    setErrors(e => ({ ...e, customerId: '' }))
  }

  const handleModelNameChange = (description) => {
    const serial = description ? generateSerialNumber(description, form.entryDate, rows) : ''
    setForm(f => ({ ...f, modelName: description, serialNumber: serial }))
    setErrors(e => ({ ...e, modelName: '' }))
  }

  const handleEntryDateChange = (date) => {
    const serial = form.modelName ? generateSerialNumber(form.modelName, date, rows) : form.serialNumber
    setForm(f => ({ ...f, entryDate: date, serialNumber: serial }))
  }

  const validate = () => {
    const errs = {}
    if (!form.customerId)  errs.customerId  = 'Required'
    if (!form.modelName)   errs.modelName   = 'Required'
    if (!form.vehicleName) errs.vehicleName = 'Required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  // ── Create / Update ──

  const handleSave = async () => {
    if (!validate()) {
      toast.warning('Please fill in all required fields.')
      return
    }
    setLoadingSave(true)
    try {
      const payload = {
        ...form,
        customerId:   Number(form.customerId),
        vehicleCount: form.vehicleCount ? Number(form.vehicleCount) : 1,
      }
      if (editId !== null) {
        const res = await api.put(`/api/vehicle-master/${editId}`, payload)
        setRows(r => r.map(x => x.id === editId ? res.data.data : x))
        setEditId(null)
        refetchVehicles()
        toast.success('Vehicle record updated successfully.')
      } else {
        const res = await api.post('/api/vehicle-master', payload)
        setRows(r => [...r, res.data.data])
        setPage(1)
        refetchVehicles()
        toast.success('Vehicle record created successfully.')
      }
      setForm(emptyForm)
      setErrors({})
    } catch (err) {
      console.error('[VehicleMaster] save error:', err)
      toast.error(err.response?.data?.message || 'Failed to save vehicle record.')
    } finally {
      setLoadingSave(false)
    }
  }

  // ── Delete ──

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setLoadingDelete(true)
    try {
      await api.delete(`/api/vehicle-master/${deleteTarget.id}`)
      setRows(r => r.filter(x => x.id !== deleteTarget.id))
      setDeleteTarget(null)
      refetchVehicles()
      toast.success('Vehicle record deleted successfully.')
    } catch (err) {
      console.error('[VehicleMaster] delete error:', err)
      toast.error(err.response?.data?.message || 'Failed to delete vehicle record.')
    } finally {
      setLoadingDelete(false)
    }
  }

  const handleEdit = row => {
    setForm({
      entryDate:     row.entryDate ? row.entryDate.split('T')[0] : today,
      customerId:    String(row.customerId || ''),
      vehicleCount:  String(row.vehicleCount ?? '1'),
      address:       row.address       || '',
      vehicleNumber: row.vehicleNumber || '',
      modelName:     row.modelName     || '',
      modelSubType:  row.modelSubType  || '',
      vehicleName:   row.vehicleName   || '',
      serialNumber:  row.serialNumber  || '',
      bomType:       row.bomType       || 'New',
      bomModelNumber: row.bomModelNumber || '',
      remarks:       row.remarks       || '',
    })
    setErrors({})
    setEditId(row.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleClear = () => { setForm(emptyForm); setErrors({}); setEditId(null) }

  // ── Filtering & pagination ──

  const filtered = rows.filter(r =>
    [r.customer?.customerName, r.customer?.cCode, r.vehicleNumber, r.modelName, r.modelSubType, r.vehicleName]
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

  const inp = (err) => `w-full border rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
  const lbl = 'text-[12.5px] font-semibold text-slate-600 whitespace-nowrap'

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Person Masters</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Vehicle Master</span>
      </div>



      {/* ── Form Card ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">
            {editId !== null ? 'Edit - Vehicle Master Details' : 'Create - Vehicle Master Details'}
          </h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">

            {/* Col 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-32 shrink-0`}>Date :</label>
                <input type="date" value={form.entryDate} onChange={e => handleEntryDateChange(e.target.value)} className={inp(false)} readOnly={true}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-32 shrink-0`}><span className="text-red-500">*</span> Customer Name :</label>
                <div className="flex-1">
                  {loadingCustomers ? (
                    <SpinnerLoader size={14} message="Loading customers..." className="h-7 py-0 justify-start" />
                  ) : (
                    <select value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} className={inp(errors.customerId)}>
                      <option value="">---Select Customer Name---</option>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.customerName}</option>)}
                    </select>
                  )}
                  {errors.customerId && <p className="text-[11px] text-red-500 mt-0.5">{errors.customerId}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-32 shrink-0`}>Customer Code :</label>
                <input value={selectedCustomer?.cCode || ''} readOnly className={`${inp(false)} bg-slate-50`}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-32 shrink-0`}>Vehicle Count :</label>
                <input type="number" min="1" value={form.vehicleCount} onChange={e => setField('vehicleCount', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-32 shrink-0 pt-1`}>Address :</label>
                <textarea value={form.address} onChange={e => setField('address', e.target.value)} rows={2} className={inp(false)}/>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}>Vehicle Number :</label>
                <input value={form.vehicleNumber} onChange={e => setField('vehicleNumber', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}><span className="text-red-500">*</span> Vehicle Model Name :</label>
                <div className="flex-1">
                  {loadingRefData ? (
                    <SpinnerLoader size={14} message="Loading..." className="h-7 py-0 justify-start" />
                  ) : (
                    <select value={form.modelName} onChange={e => handleModelNameChange(e.target.value)} className={inp(errors.modelName)}>
                      <option value="">---Select Model Name---</option>
                      {modelNameOptions.map(m => <option key={m}>{m}</option>)}
                    </select>
                  )}
                  {errors.modelName && <p className="text-[11px] text-red-500 mt-0.5">{errors.modelName}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}>Model Sub Type :</label>
                {loadingRefData ? (
                  <SpinnerLoader size={14} message="Loading..." className="h-7 py-0 justify-start" />
                ) : (
                  <select value={form.modelSubType} onChange={e => setField('modelSubType', e.target.value)} className={inp(false)}>
                    <option value="">---Select Model Sub Type---</option>
                    {modelSubTypeOptions.map(m => <option key={m}>{m}</option>)}
                  </select>
                )}
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}><span className="text-red-500">*</span> Vehicle Name :</label>
                <div className="flex-1">
                  {loadingRefData ? (
                    <SpinnerLoader size={14} message="Loading..." className="h-7 py-0 justify-start" />
                  ) : (
                    <select value={form.vehicleName} onChange={e => setField('vehicleName', e.target.value)} className={inp(errors.vehicleName)}>
                      <option value="">---Select Vehicle Name---</option>
                      {vehicleNameOptions.map(v => <option key={v}>{v}</option>)}
                    </select>
                  )}
                  {errors.vehicleName && <p className="text-[11px] text-red-500 mt-0.5">{errors.vehicleName}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}>Serial Number :</label>
                <input value={form.serialNumber} readOnly className={`${inp(false)} bg-slate-50 font-mono tracking-wide text-[#0097A7]`} placeholder="Auto-generated on model select"/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}><span className="text-red-500">*</span> B.O.M. Type :</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                    <input type="radio" name="bomType" value="New" checked={form.bomType === 'New'} onChange={e => setField('bomType', e.target.value)} className="text-[#0097A7]"/>
                    New
                  </label>
                  <label className="flex items-center gap-1.5 text-[13px] cursor-pointer">
                    <input type="radio" name="bomType" value="Existing" checked={form.bomType === 'Existing'} onChange={e => setField('bomType', e.target.value)} className="text-[#0097A7]"/>
                    Existing
                  </label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}>B.O.M. Model Number :</label>
                <select value={form.bomModelNumber} onChange={e => setField('bomModelNumber', e.target.value)} className={inp(false)}>
                  <option value="">---Select B.O.M. Model Number---</option>
                  {BOM_MODELS.map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-36 shrink-0`}>Remarks :</label>
                <input value={form.remarks} onChange={e => setField('remarks', e.target.value)} className={inp(false)}/>
              </div>
              <div className="flex gap-2 pt-2 justify-end">
                <button
                  onClick={handleSave}
                  disabled={loadingSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#27ae60] hover:bg-[#229954] disabled:opacity-60 text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
                >
                  {loadingSave ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                  {editId !== null ? 'Update' : 'Create'}
                </button>
                <button
                  onClick={handleClear}
                  disabled={loadingSave}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
                >
                  <RotateCcw className="w-4 h-4"/> Clear
                </button>
                <button
                  onClick={() => { fetchVehicles(); setPage(1) }}
                  disabled={loadingList}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 text-white text-[13px] font-semibold rounded transition-colors shadow-sm"
                >
                  {loadingList ? <Loader2 className="w-4 h-4 animate-spin"/> : <List className="w-4 h-4"/>}
                  Display All
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white rounded border border-slate-200 shadow-sm">
        <div className="bg-[--color-main] px-4 py-2.5">
          <h2 className="text-white text-center font-semibold text-[14px]">Vehicle Master Details</h2>
        </div>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-2 text-[13px] text-slate-600">
            <span className="font-semibold">Search:</span>
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search..." className="border border-slate-300 rounded px-3 py-1.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] w-72 bg-white"/>
          </div>
          <div className="flex items-center gap-2 text-[13px] text-slate-600 ml-auto">
            Show
            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }} className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white">
              {PAGE_SIZES.map(s => <option key={s}>{s}</option>)}
            </select>
            entries
          </div>
        </div>

        {loadingList ? (
          <TableSkeleton rows={5} cols={['6%','10%','16%','9%','12%','12%','12%','13%','7%','7%']} />
        ) : (
        <div className="overflow-x-auto w-full">
          {(
            <table className="min-w-full text-[13px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['S.No.', 'Entry Date', 'Customer Name', 'Vehicle Count', 'Vehicle Number', 'Model Name', 'Sub Model Type', 'Vehicle Name', 'Edit', 'Delete', 'Details'].map(h => (
                    <th key={h} className="text-center px-2 py-1.5 font-bold text-slate-600 text-[12px] uppercase tracking-wide whitespace-nowrap">
                      {h}
                      {['Entry Date', 'Customer Name', 'Vehicle Count', 'Vehicle Number', 'Model Name', 'Sub Model Type', 'Vehicle Name'].includes(h) && (
                        <svg className="inline w-3 h-3 ml-1 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/>
                        </svg>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paged.length === 0
                  ? <tr><td colSpan={11} className="text-center py-8 text-slate-400 text-[12px]">No records found</td></tr>
                  : paged.map((row, idx) => (
                    <tr key={row.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-2 py-1.5 text-center">{(page - 1) * pageSize + idx + 1}</td>
                      <td className="px-2 py-1.5 text-center">{row.entryDate ? new Date(row.entryDate).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="px-2 py-1.5 text-center font-medium">{row.customer?.customerName || '—'}</td>
                      <td className="px-2 py-1.5 text-center text-[#0097A7]">{row.vehicleCount ?? '—'}</td>
                      <td className="px-2 py-1.5 text-center">{row.vehicleNumber || '—'}</td>
                      <td className="px-2 py-1.5 text-center">{row.modelName}</td>
                      <td className="px-2 py-1.5 text-center">{row.modelSubType || '—'}</td>
                      <td className="px-2 py-1.5 text-center">{row.vehicleName}</td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => handleEdit(row)} className="px-2 py-1 bg-[--color-main] hover:bg-[#3498db] text-white text-[11px] rounded transition-colors" title="Edit">
                          <Edit className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => setDeleteTarget(row)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => setDetailRow(row)} className="px-2 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] rounded transition-colors" title="Details">
                          <Info className="w-3.5 h-3.5"/>
                        </button>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        )}

        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
          <span className="text-[12px] text-slate-500">
            Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Previous</button>
            {pageNums().map((n, i) => n === '...'
              ? <span key={`e${i}`} className="px-2 text-slate-400 text-[12px]">…</span>
              : <button key={n} onClick={() => setPage(n)} className={`w-8 h-8 text-[12px] rounded border transition-colors ${page === n ? 'bg-[#0097A7] text-white border-[#0097A7]' : 'border-slate-300 hover:bg-slate-100 text-slate-600'}`}>{n}</button>
            )}
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-[12px] border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next</button>
          </div>
        </div>
      </div>

      {detailRow && <DetailModal row={detailRow} onClose={() => setDetailRow(null)}/>}

      {deleteTarget && (
        <ConfirmDeleteModal
          customerName={deleteTarget.customer?.customerName || 'this record'}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          loading={loadingDelete}
        />
      )}
    </div>
  )
}
