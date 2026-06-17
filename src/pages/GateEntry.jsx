import { useState, useEffect } from 'react'
import { ChevronRight, Search, Send, X, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useLoading } from '../context/LoadingContext'
import { SpinnerLoader } from '../components/LocalLoader'

const BASE = 'http://localhost:3000'
const today = new Date().toISOString().split('T')[0]

const emptyForm = () => ({
  poNo: '', prqNo: '', supplierName: '', supplierAddress: '',
  gateNo: '', carrierName: '', vehicleNo: '', user: 'superadmin',
  gateEntryNo: '', financialYear: '', gateEntryDate: today,
  invoiceNo: '', invoiceDate: today, taxType: '',
})

const emptyItem = () => ({ poNo:'', itemCode:'', itemName:'', supplierPartNo:'', description:'', hsnCode:'', unit:'', qty:'', recQty:'' })

const inp = (err='') => `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err?'border-red-400 focus:ring-red-300':'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

export default function GateEntry() {
  const toast = useToast()
  const { show: showLoader, hide: hideLoader } = useLoading()

  const [form, setForm] = useState(emptyForm())
  const [items, setItems] = useState([emptyItem()])
  const [remarks, setRemarks] = useState('')
  const [editId, setEditId] = useState(null)

  const [allPOs, setAllPOs] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [taxTypeOptions, setTaxTypeOptions] = useState([])
  const [poSearch, setPoSearch] = useState('')
  const [showPoModal, setShowPoModal] = useState(false)
  const [selectedPoId, setSelectedPoId] = useState(null)

  const [loadingInit, setLoadingInit] = useState(false)
  const [loadingPOItems, setLoadingPOItems] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [recQtyErrors, setRecQtyErrors] = useState({})

  /* ── on mount: next GE no + all POs ── */
  useEffect(() => {
    const init = async () => {
      setLoadingInit(true)
      try {
        const [noRes, poRes, supRes, taxRes] = await Promise.all([
          fetch(`${BASE}/api/gate-master/next-no`),
          fetch(`${BASE}/api/purchase-master`),
          fetch(`${BASE}/api/supplier-master`),
          fetch(`${BASE}/api/reference-master/${encodeURIComponent('Tax Type')}`),
        ])
        const [noJson, poJson, supJson, taxJson] = await Promise.all([noRes.json(), poRes.json(), supRes.json(), taxRes.json()])
        if (noJson.success) setForm(f => ({ ...f, gateEntryNo: noJson.gateEntryNo, financialYear: noJson.financialYear || '' }))
        if (poJson.success) setAllPOs(poJson.data)
        if (supJson.success) setSuppliers(supJson.data)
        if (taxJson.data) setTaxTypeOptions(taxJson.data)
      } catch { toast.error('Failed to load data') }
      finally { setLoadingInit(false) }
    }

    /* check for edit intent from GateEntryReport */
    const editId = localStorage.getItem('velson:gate-edit')
    if (editId) {
      localStorage.removeItem('velson:gate-edit')
      loadForEdit(parseInt(editId, 10))
    } else {
      init()
    }
  }, [])

  const loadForEdit = async (id) => {
    setLoadingInit(true)
    try {
      const [entryRes, poRes, supRes, taxRes] = await Promise.all([
        fetch(`${BASE}/api/gate-master/${id}`),
        fetch(`${BASE}/api/purchase-master`),
        fetch(`${BASE}/api/supplier-master`),
        fetch(`${BASE}/api/reference-master/${encodeURIComponent('Tax Type')}`),
      ])
      const [entryJson, poJson, supJson, taxJson] = await Promise.all([entryRes.json(), poRes.json(), supRes.json(), taxRes.json()])
      if (poJson.success) setAllPOs(poJson.data)
      if (supJson.success) setSuppliers(supJson.data)
      if (taxJson.data) setTaxTypeOptions(taxJson.data)
      if (entryJson.success) {
        const e = entryJson.data
        setEditId(e.id)
        setForm({
          poNo: e.poNo || '', prqNo: e.prqNo || '',
          supplierName: e.supplierName || '', supplierAddress: e.supplierAddress || '',
          gateNo: e.gateNo || '', carrierName: e.carrierName || '',
          vehicleNo: e.vehicleNo || '', user: e.createdBy || 'superadmin',
          gateEntryNo: e.gateEntryNo, financialYear: e.financialYear || '',
          gateEntryDate: e.gateEntryDate ? e.gateEntryDate.split('T')[0] : today,
          invoiceNo: e.invoiceNo || '', invoiceDate: e.invoiceDate ? e.invoiceDate.split('T')[0] : today,
          taxType: e.taxType || '',
        })
        setPoSearch(e.poNo || '')
        setSelectedPoId(e.poId || null)
        setRemarks(e.remarks || '')
        setItems(e.details?.length > 0 ? e.details.map(d => ({
          poNo: d.poNo || '', itemCode: d.itemCode || '', itemName: d.itemName || '',
          supplierPartNo: d.supplierPartNo || '', description: d.description || '',
          hsnCode: d.hsnCode || '', unit: d.unit || '',
          qty: d.qty != null ? String(d.qty) : '', recQty: d.recQty != null ? String(d.recQty) : '',
        })) : [emptyItem()])
      }
    } catch { toast.error('Failed to load entry') }
    finally { setLoadingInit(false) }
  }

  const filteredPOs = allPOs
    .filter(po => po.status === 'Approval' && po.poNo.toLowerCase().includes(poSearch.toLowerCase()))
    .sort((a, b) => a.poNo.localeCompare(b.poNo))

  const extractPrqNo = (details) => {
    const nos = [...new Set(details.map(d => d.purchaseReqNo).filter(Boolean))]
    return nos.join(', ')
  }

  const selectPO = async (po) => {
    setShowPoModal(false)
    setSelectedPoId(po.id)

    // Reset fields immediately so stale values never linger
    setForm(f => ({
      ...f,
      poNo: po.poNo,
      prqNo: '',
      supplierName: po.supplier?.supplierName || '',
      supplierAddress: po.supplierAddress || '',
    }))
    setItems([emptyItem()])
    setRecQtyErrors({})

    // Always fetch full PO from API to get accurate purchaseReqNo per detail row
    setLoadingPOItems(true)
    try {
      const res = await fetch(`${BASE}/api/purchase-master/${po.id}`)
      const json = await res.json()
      if (json.success) {
        const data = json.data
        const det = data.details || []
        setForm(f => ({
          ...f,
          prqNo: data.prNo || extractPrqNo(det) || '',
          supplierName: data.supplier?.supplierName || '',
          supplierAddress: data.supplierAddress || '',
        }))
        setItems(det.length > 0 ? det.map(d => ({
          poNo: data.poNo, itemCode: d.itemCode || '', itemName: d.itemName || '',
          supplierPartNo: d.supplierPartNo || data.supplierRefNo || '',
          description: d.description || '', hsnCode: d.hsnCode || '',
          unit: d.uom || '', qty: d.qty != null ? String(d.qty) : '', recQty: '',
        })) : [emptyItem()])
      }
    } catch { toast.error('Failed to fetch PO details') }
    finally { setLoadingPOItems(false) }
  }

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setItemField = (idx, k, v) => {
    setItems(rows => {
      const updated = rows.map((r, i) => i !== idx ? r : { ...r, [k]: v })
      if (k === 'recQty') {
        const row = updated[idx]
        const recQ = parseFloat(v)
        const ordQ = parseFloat(row.qty)
        setRecQtyErrors(e => {
          const n = { ...e }
          if (v !== '' && !isNaN(recQ) && !isNaN(ordQ) && recQ > ordQ) n[idx] = true
          else delete n[idx]
          return n
        })
      }
      return updated
    })
  }
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  const handleSupplierChange = name => {
    const sup = suppliers.find(s => s.supplierName === name)
    const addr = sup ? [sup.address, sup.address2, sup.address3, sup.address4, sup.city].filter(Boolean).join(', ') : ''
    setForm(f => ({ ...f, supplierName: name, supplierAddress: addr }))
  }

  const fetchNextNo = async () => {
    try {
      const res = await fetch(`${BASE}/api/gate-master/next-no`)
      const json = await res.json()
      if (json.success) setForm(f => ({ ...f, gateEntryNo: json.gateEntryNo, financialYear: json.financialYear || '' }))
    } catch {}
  }

  const resetForm = async () => {
    setForm(emptyForm())
    setItems([emptyItem()])
    setRemarks('')
    setPoSearch('')
    setSelectedPoId(null)
    setEditId(null)
    setRecQtyErrors({})
    await fetchNextNo()
  }

  const validate = () => {
    const errors = {}
    items.forEach((row, idx) => {
      const recQ = parseFloat(row.recQty)
      const ordQ = parseFloat(row.qty)
      if (row.recQty !== '' && !isNaN(recQ) && !isNaN(ordQ) && recQ > ordQ) {
        errors[idx] = true
        toast.warning(`Received Qty for "${row.itemName || `Row ${idx + 1}`}" (${recQ}) exceeds ordered Qty (${ordQ}).`)
      }
    })
    setRecQtyErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    showLoader(editId ? 'Updating gate entry...' : 'Saving gate entry...')
    try {
      const url = editId ? `${BASE}/api/gate-master/${editId}` : `${BASE}/api/gate-master`
      const method = editId ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          poId: selectedPoId,
          remarks,
          createdBy: form.user,
          updatedBy: form.user,
          items: items.filter(r => r.itemCode || r.itemName),
        }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(editId ? 'Gate Entry updated!' : 'Gate Entry submitted!')
        await resetForm()
      } else {
        toast.error(json.message || 'Operation failed')
      }
    } catch { toast.error('Server error. Please try again.') }
    finally { setSubmitting(false); hideLoader() }
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">Gate Entry</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">{editId ? 'Edit' : 'Create'} - Gate Entry</h2>
          <button onClick={resetForm} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">Close</button>
        </div>

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {/* Col 1 */}
            <div className="space-y-2">
              {/* PO No with modal search */}
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>PO No :</label>
                <input value={form.poNo} readOnly placeholder="Select PO..." className={`${inp()} flex-1 bg-slate-50`}/>
                <button
                  onClick={() => { setPoSearch(''); setShowPoModal(true) }}
                  disabled={loadingInit}
                  className="px-3 py-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-[12px] rounded transition-colors shrink-0 flex items-center gap-1"
                >
                  <Search className="w-3 h-3"/> Search
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>PRQ No :</label>
                <input value={form.prqNo} onChange={e=>setField('prqNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Supplier Name:</label>
                <select value={form.supplierName} onChange={e=>handleSupplierChange(e.target.value)} className={inp()}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s=><option key={s.id} value={s.supplierName}>{s.supplierName}</option>)}
                </select>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[130px] shrink-0 pt-1`}>Supplier Address :</label>
                <textarea rows={3} value={form.supplierAddress} onChange={e=>setField('supplierAddress',e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white"/>
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Gate No :</label>
                <input value={form.gateNo} onChange={e=>setField('gateNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Carrier Name :</label>
                <input value={form.carrierName} onChange={e=>setField('carrierName',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Vehicle No :</label>
                <input value={form.vehicleNo} onChange={e=>setField('vehicleNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>User :</label>
                <input value={form.user} readOnly className={`${inp()} bg-slate-50`}/>
              </div>
            </div>

            {/* Col 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Gate Entry No :</label>
                <input value={form.gateEntryNo} readOnly className={`${inp()} bg-slate-50`}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Gate Entry Date :</label>
                <input type="date" value={form.gateEntryDate} onChange={e=>setField('gateEntryDate',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Invoice No :</label>
                <input value={form.invoiceNo} onChange={e=>setField('invoiceNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Invoice Date :</label>
                <input type="date" value={form.invoiceDate} onChange={e=>setField('invoiceDate',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Tax Type :</label>
                <select value={form.taxType} onChange={e=>setField('taxType',e.target.value)} className={inp()}>
                  <option value="">Select Tax Type</option>
                  {taxTypeOptions.map(t=><option key={t.id} value={t.description}>{t.description}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-2">
            <div className="bg-slate-700 px-3 py-1.5 rounded-t"><h3 className="text-white text-[13px] font-semibold">Items</h3></div>
            <div className="overflow-x-auto border border-slate-200 rounded-b relative">
              {loadingPOItems && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <SpinnerLoader message="Loading PO items..." />
                </div>
              )}
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8"><input type="checkbox" className="accent-[#0097A7]"/></th>
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">#</th>
                    {['PO No','Item Code','Item Name','Supplier Part No','Description','HSN Code','Unit','Qty','Rec Qty','Action'].map(h=>(
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row,idx)=>(
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                      <td className="px-2 py-1 text-center"><input type="checkbox" className="accent-[#0097A7]"/></td>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1"><input value={row.poNo} onChange={e=>setItemField(idx,'poNo',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.itemCode} onChange={e=>setItemField(idx,'itemCode',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.itemName} onChange={e=>setItemField(idx,'itemName',e.target.value)} className={`${inp()} min-w-[140px]`}/></td>
                      <td className="px-1 py-1"><input value={row.supplierPartNo} readOnly className={`${inp()} bg-slate-50`}/></td>
                      <td className="px-1 py-1"><input value={row.description} onChange={e=>setItemField(idx,'description',e.target.value)} className={`${inp()} min-w-[120px]`}/></td>
                      <td className="px-1 py-1"><input value={row.hsnCode} onChange={e=>setItemField(idx,'hsnCode',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.unit} onChange={e=>setItemField(idx,'unit',e.target.value)} className={`${inp()} w-14`}/></td>
                      <td className="px-1 py-1"><input value={row.qty} readOnly className={`${inp()} w-16 bg-slate-50`}/></td>
                      <td className="px-1 py-1">
                        <input
                          value={row.recQty}
                          onChange={e=>setItemField(idx,'recQty',e.target.value)}
                          placeholder="0"
                          className={`${inp(recQtyErrors[idx])} w-16`}
                        />
                      </td>
                      <td className="px-2 py-1 text-center"><button onClick={()=>removeRow(idx)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors">Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Remarks + Submit */}
          <div className="flex items-start gap-4 pt-2">
            <label className={`${lbl} w-[100px] shrink-0 pt-1`}>Remark's :</label>
            <textarea rows={2} value={remarks} onChange={e=>setRemarks(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white"/>
          </div>
          <div className="flex gap-2 justify-center pt-1">
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(recQtyErrors).length > 0}
              className="flex items-center gap-1 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 text-white text-[12px] font-semibold rounded transition-colors shadow-sm"
            >
              <Send className="w-3.5 h-3.5"/>
              {editId ? 'Update' : 'Submit'}
            </button>
            <button onClick={resetForm} disabled={submitting} className="flex items-center gap-1 px-5 py-1.5 bg-slate-500 hover:bg-slate-600 disabled:opacity-60 text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
              <X className="w-3.5 h-3.5"/> Cancel
            </button>
          </div>
        </div>
      </div>
      {/* PO Search Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-xl w-[700px] max-h-[80vh] flex flex-col">
            <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between rounded-t">
              <h3 className="text-white font-semibold text-[14px]">Select Purchase Order</h3>
              <button onClick={() => setShowPoModal(false)} className="text-white hover:text-white/70"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-3 border-b border-slate-200">
              <input
                autoFocus
                value={poSearch}
                onChange={e => setPoSearch(e.target.value)}
                placeholder="Search by PO No, Supplier..."
                className={`${inp()} w-full`}
              />
            </div>
            <div className="overflow-auto flex-1">
              {filteredPOs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[13px]">No purchase orders found.</div>
              ) : (
                <table className="min-w-full text-[12.5px]">
                  <thead className="sticky top-0">
                    <tr className="bg-[#4472C4] text-white">
                      {['PO No','PO Date','Supplier Name','Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPOs.map((po, i) => (
                      <tr
                        key={po.id}
                        onClick={() => selectPO(po)}
                        className={`cursor-pointer border-b border-slate-100 hover:bg-[#0097A7]/10 ${i%2===1?'bg-slate-50/50':''}`}
                      >
                        <td className="px-3 py-1.5 font-medium text-[#0097A7]">{po.poNo}</td>
                        <td className="px-3 py-1.5">{po.poDate ? po.poDate.split('T')[0] : '-'}</td>
                        <td className="px-3 py-1.5">{po.supplier?.supplierName || '-'}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-green-100 text-green-700">{po.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-200 text-[11px] text-slate-400 text-right">
              {filteredPOs.length} record{filteredPOs.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
