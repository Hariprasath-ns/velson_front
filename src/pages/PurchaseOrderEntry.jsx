import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Plus, Trash2, Send, X, Save, DollarSign } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useLoading } from '../context/LoadingContext'
import { useModulePermission } from '../hooks/useModulePermission'
import api from '../services/api'
import {
  useReferenceMaster,
  useSuppliers,
  usePurchaseRequests
} from '../hooks/useMasterData'
import { useQueryClient } from '@tanstack/react-query'
import ItemSearchInput from '../components/ItemSearchInput'

const FIELD_REF_TYPES = {
  freight:       'PO Freight',
  destination:   'PO Destination',
  paymentTerms:  'PO Payment Terms',
  testReport:    'PO Test Report',
  project:       'PO Project',
  modeOfDespatch:'PO Mode Of Despatch',
}

const buildSupplierAddress = (s) =>
  [s.address, s.address2, s.address3, s.address4, s.city, s.state, s.pinCode]
    .filter(Boolean).join(', ')

const formatDatetimeLocal = (isoDate) => {
  const d = isoDate ? new Date(isoDate) : new Date()
  if (isNaN(d.getTime())) return ''
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const nowDatetime = formatDatetimeLocal(new Date())

const emptyItem = () => ({
  itemId: null, itemCode:'', purchaseReqNo:'', supplierPartNo:'', itemName:'', description:'',
  hsnCode:'', uom:'', qty:'', unitPrice:'',
  amount:'', gstPer:'18', gstAmt:'', netAmt:'',
})

const inp = (err='') =>
  `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

const ComboInput = ({ id, value, onChange, className, placeholder, suggestions = [] }) => (
  <>
    <input list={`po-dl-${id}`} value={value} onChange={onChange} placeholder={placeholder} className={className} autoComplete="off" />
    {suggestions.length > 0 && (
      <datalist id={`po-dl-${id}`}>
        {suggestions.map(s => <option key={s} value={s} />)}
      </datalist>
    )}
  </>
)

export default function PurchaseOrderEntry() {
  const toast = useToast()
  const queryClient = useQueryClient()
  const { show: showLoader, hide: hideLoader } = useLoading()
  const { canSave, canEdit } = useModulePermission('purchase-order')

  // Master data
  const { data: suppliersRaw = [] } = useSuppliers()
  const { data: purchaseRequestsRaw = [] } = usePurchaseRequests()

  const { data: poTypesRes = [] } = useReferenceMaster('PO Type')
  const { data: poFreightRes = [] } = useReferenceMaster('PO Freight')
  const { data: poDestinationRes = [] } = useReferenceMaster('PO Destination')
  const { data: poPaymentTermsRes = [] } = useReferenceMaster('PO Payment Terms')
  const { data: poTestReportRes = [] } = useReferenceMaster('PO Test Report')
  const { data: poProjectRes = [] } = useReferenceMaster('PO Project')
  const { data: poModeOfDespatchRes = [] } = useReferenceMaster('PO Mode Of Despatch')

  const poTypes = poTypesRes.map(r => r.description).filter(Boolean)
  const poFreight = poFreightRes.map(r => r.description).filter(Boolean)
  const poDestination = poDestinationRes.map(r => r.description).filter(Boolean)
  const poPaymentTerms = poPaymentTermsRes.map(r => r.description).filter(Boolean)
  const poTestReport = poTestReportRes.map(r => r.description).filter(Boolean)
  const poProject = poProjectRes.map(r => r.description).filter(Boolean)
  const poModeOfDespatch = poModeOfDespatchRes.map(r => r.description).filter(Boolean)

  const fieldSuggestions = {
    freight: poFreight,
    destination: poDestination,
    paymentTerms: poPaymentTerms,
    testReport: poTestReport,
    project: poProject,
    modeOfDespatch: poModeOfDespatch
  }

  const [form, setForm] = useState({
    supplierId: null,
    supplierName: '', supplierAddress: '', contactPerson: '', contactNumber: '',
    createdBy: '', gstNo: '', supplierRefNumber: '', showTotalsGrid: false,
    poNumber: '', poDate: nowDatetime, etaDate: nowDatetime, poType: 'Purchase Order',
  })
  const [items, setItems] = useState([emptyItem()])
  const suppliersData = suppliersRaw
  const suppliers = suppliersRaw.map(s => s.supplierName)
  const [submitting, setSubmitting] = useState(false)
  const [editPoId, setEditPoId] = useState(null)
  const [taxMasters, setTaxMasters] = useState([])

  // Others Charges Modal State
  const [showOthersModal, setShowOthersModal] = useState(false)
  const [othersCharges, setOthersCharges] = useState({
    freight: '0',
    packaging: '0',
    handling: '0',
    insurance: '0',
    misc: '0'
  })

  // Bottom fields
  const [freight, setFreight] = useState('')
  const [destination, setDestination] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('')
  const [testReport, setTestReport] = useState('')
  const [project, setProject] = useState('')
  const [remarks, setRemarks] = useState('')
  const [modeOfDespatch, setModeOfDespatch] = useState('')
  const [deliveryPeriod, setDeliveryPeriod] = useState('')
  const [taxTerms, setTaxTerms] = useState('')
  const [warrantyTerms, setWarrantyTerms] = useState('')
  const [discountTerms, setDiscountTerms] = useState('')

  // Tax fields
  const [taxMode, setTaxMode] = useState('intra') // 'intra' (CGST+SGST) or 'inter' (IGST)
  const [othersPer, setOthersPer] = useState('0')
  const [othersAmt, setOthersAmt] = useState('0')
  const [cgstPer, setCgstPer] = useState('9')
  const [cgstAmt, setCgstAmt] = useState('0')
  const [sgstPer, setSgstPer] = useState('9')
  const [sgstAmt, setSgstAmt] = useState('0')
  const [igstPer, setIgstPer] = useState('0')
  const [igstAmt, setIgstAmt] = useState('0')

  const fetchNextPoNo = async () => {
    try {
      const res = await api.get('/api/purchase-master/next-no')
      if (res.data?.success) setField('poNumber', res.data.poNo)
    } catch (err) {
      console.error('Error fetching next PO number:', err)
    }
  }

  const fetchItemMasterByCode = async (itemCode) => {
    if (!itemCode) return null
    try {
      const res = await api.get(`/api/item-master?search=${encodeURIComponent(itemCode)}&limit=1`, { skipGlobalLoader: true })
      const items = res.data?.data || []
      return items.find(it => it.partNo === itemCode) || items[0] || null
    } catch (err) {
      console.error(`Failed to fetch master info for itemCode ${itemCode}:`, err)
      return null
    }
  }

  const initDone = useRef(false)

  useEffect(() => {
    if (initDone.current) return
    initDone.current = true

    const loadData = async () => {
      // Fetch tax masters
      try {
        const tmRes = await api.get('/api/tax-master', { skipGlobalLoader: true })
        if (tmRes.data?.success && tmRes.data?.data) {
          setTaxMasters(tmRes.data.data)
        }
      } catch (err) {
        console.error('Error fetching tax masters:', err)
      }

      const editPoIdStr = localStorage.getItem('velson:po-edit')
      if (editPoIdStr) {
        localStorage.removeItem('velson:po-edit')
        const poId = parseInt(editPoIdStr, 10)
        setEditPoId(poId)
        try {
          const poRes = await api.get(`/api/purchase-master/${poId}`)
          if (poRes.data?.success && poRes.data?.data) {
            const po = poRes.data.data
            setForm(f => ({
              ...f,
              supplierId:       po.supplierId      || null,
              supplierName:     po.supplier?.supplierName || '',
              supplierAddress:  po.supplierAddress || '',
              contactPerson:    po.contactPerson   || '',
              contactNumber:    po.contactNumber   || '',
              createdBy:        po.createdBy       || '',
              gstNo:            po.gstNo           || '',
              supplierRefNumber: po.supplierRefNo  || '',
              poNumber:         po.poNo            || '',
              poDate:           po.poDate ? formatDatetimeLocal(po.poDate) : nowDatetime,
              etaDate:          po.etaDate ? formatDatetimeLocal(po.etaDate) : nowDatetime,
              poType:           po.poType          || 'Purchase Order',
            }))
            if (po.details?.length > 0) {
              setItems(po.details.map(it => {
                const q = parseFloat(it.qty) || 0
                const p = parseFloat(it.unitPrice) || 0
                const amt = q * p
                const gp = parseFloat(it.gstPer) || 0
                const ga = amt * gp / 100
                return {
                  ...emptyItem(),
                  ...it,
                  purchaseReqNo: it.purchaseReqNo || '',
                  amount: amt > 0 ? amt.toFixed(2) : String(it.amount || ''),
                  gstAmt: ga > 0 ? ga.toFixed(2) : String(it.gstAmt || ''),
                  netAmt: (amt + ga) > 0 ? (amt + ga).toFixed(2) : String(it.netAmt || ''),
                }
              }))
            }
            setFreight(po.freight && po.freight !== 0 ? String(po.freight) : '')
            setDestination(po.destination || '')
            setPaymentTerms(po.paymentTerms || '')
            setTestReport(po.testReport || '')
            setProject(po.project || '')
            setModeOfDespatch(po.modeOfDespatch || '')
            setDeliveryPeriod(po.deliveryPeriod || '')
            setTaxTerms(po.taxTerms || '')
            setWarrantyTerms(po.warrantyTerms || '')
            setDiscountTerms(po.discountTerms || '')
            setRemarks(po.remarks || '')
            setCgstPer(po.cgstPer ? String(po.cgstPer) : '0')
            setCgstAmt(po.cgstAmt ? String(po.cgstAmt) : '0')
            setSgstPer(po.sgstPer ? String(po.sgstPer) : '0')
            setSgstAmt(po.sgstAmt ? String(po.sgstAmt) : '0')
            setIgstPer(po.igstPer ? String(po.igstPer) : '0')
            setIgstAmt(po.igstAmt ? String(po.igstAmt) : '0')
            setOthersPer(po.othersPer ? String(po.othersPer) : '0')
            setOthersAmt(po.othersAmt ? String(po.othersAmt) : '0')
            setOthersCharges(prev => ({ ...prev, misc: po.othersAmt ? String(po.othersAmt) : '0' }))
            if (parseFloat(po.igstAmt) > 0) setTaxMode('inter')
          }
        } catch (e) {
          console.error('PO edit load error:', e)
        }
      } else {
        const prPickId = window.__velsonPrPickId ?? null
        if (prPickId) window.__velsonPrPickId = null

        if (prPickId) {
          try {
            const prRes = await api.get(`/api/purchase-request/${prPickId}`)
            if (prRes.data?.success && prRes.data?.data) {
              const pr = prRes.data.data
              await fetchNextPoNo()
              const masters = await Promise.all(
                pr.details.map(d => fetchItemMasterByCode(d.itemCode))
              )
              const prefillItems = pr.details.map((d, i) => {
                const master = masters[i]
                const qtyVal   = parseFloat(d.qty) || 0
                const priceVal = master?.purchaseRate || 0
                const amtVal   = qtyVal * priceVal
                const gstRate  = master?.taxPercent != null ? master.taxPercent : (master?.gstPer != null ? master.gstPer : (master?.tax?.taxPercent != null ? master.tax.taxPercent : 0))
                const gstVal   = amtVal * gstRate / 100
                return {
                  ...emptyItem(),
                  purchaseReqNo:  pr.prNo || '',
                  itemId:         master?.id              || null,
                  itemCode:       d.itemCode              || '',
                  itemName:       d.itemName              || master?.partName    || '',
                  description:    d.specification         || master?.description || '',
                  hsnCode:        master?.hsnCode         || '',
                  uom:            d.uom                   || master?.uom        || '',
                  supplierPartNo: master?.outsourcePartNo || '',
                  qty:            String(d.qty ?? ''),
                  unitPrice:      master?.purchaseRate != null ? String(master.purchaseRate) : '',
                  amount:         amtVal > 0 ? amtVal.toFixed(2) : '',
                  gstPer:         String(gstRate),
                  gstAmt:         gstVal > 0 ? gstVal.toFixed(2) : '',
                  netAmt:         (amtVal + gstVal) > 0 ? (amtVal + gstVal).toFixed(2) : '',
                }
              })
              setItems(prefillItems.length > 0 ? prefillItems : [emptyItem()])
            }
          } catch (e) {
            console.error('PO prefill parse error:', e)
          }
        } else {
          await fetchNextPoNo()
        }
      }
    }

    loadData()
  }, [])

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSupplierChange = name => {
    const supplier = suppliersData.find(s => s.supplierName === name)
    if (supplier) {
      setForm(f => ({
        ...f,
        supplierId: supplier.id,
        supplierName: name,
        supplierAddress: buildSupplierAddress(supplier),
        contactPerson: supplier.contactPerson || '',
        contactNumber: supplier.mobile || supplier.phone || '',
        gstNo: supplier.gstNo || '',
        supplierRefNumber: supplier.sCode || '',
      }))
    } else {
      setForm(f => ({
        ...f, supplierId: null, supplierName: name,
        supplierAddress: '', contactPerson: '', contactNumber: '', gstNo: '', supplierRefNumber: '',
      }))
    }
  }

  const handleItemSelect = async (idx, val, item) => {
    let resolvedItem = item
    if (!resolvedItem && val && val.trim().length > 0) {
      try {
        resolvedItem = await fetchItemMasterByCode(val.trim())
      } catch (e) {
        resolvedItem = null
      }
    }

    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      if (!resolvedItem) {
        return { ...r, itemCode: val }
      }
      const fetchedGstPer = resolvedItem.taxPercent != null 
        ? String(resolvedItem.taxPercent) 
        : (resolvedItem.gstPer != null 
            ? String(resolvedItem.gstPer) 
            : (resolvedItem.tax?.taxPercent != null ? String(resolvedItem.tax.taxPercent) : '0'))
      let updated = {
        ...r,
        itemId: resolvedItem.id,
        itemCode: resolvedItem.partNo || val || '',
        itemName: resolvedItem.partName || '',
        description: resolvedItem.description || '',
        hsnCode: resolvedItem.hsnCode || '',
        uom: resolvedItem.uom || resolvedItem.uomName || '',
        supplierPartNo: resolvedItem.outsourcePartNo || '',
        unitPrice: resolvedItem.purchaseRate != null ? String(resolvedItem.purchaseRate) : (r.unitPrice || ''),
        gstPer: fetchedGstPer
      }
      const q = parseFloat(updated.qty) || 0
      const p = parseFloat(updated.unitPrice) || 0
      const rawAmt = q * p
      updated.amount = rawAmt.toFixed(2)
      const gp = parseFloat(updated.gstPer) || 0
      const ga = rawAmt * gp / 100
      updated.gstAmt = ga.toFixed(2)
      updated.netAmt = (rawAmt + ga).toFixed(2)
      return updated
    }))
  }

  const setItemField = (idx, k, v) => {
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      let updated = { ...r, [k]: v }
      const q = parseFloat(k === 'qty' ? v : updated.qty) || 0
      const p = parseFloat(k === 'unitPrice' ? v : updated.unitPrice) || 0
      const rawAmt = q * p
      updated.amount = rawAmt.toFixed(2)
      const gp = parseFloat(k === 'gstPer' ? v : updated.gstPer) || 0
      const ga = rawAmt * gp / 100
      updated.gstAmt = ga.toFixed(2)
      updated.netAmt = (rawAmt + ga).toFixed(2)
      return updated
    }))
  }

  const addRow = () => setItems(r => [...r, emptyItem()])
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  // Calculations
  const itemSubTotal = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const totalItemGstAmt = items.reduce((s, r) => s + (parseFloat(r.gstAmt) || 0), 0)

  // Dynamic tax calculation based on Tax Master and mode (strictly on itemSubTotal)
  const effectiveCgstAmt = taxMode === 'intra' ? (totalItemGstAmt / 2) : 0
  const effectiveSgstAmt = taxMode === 'intra' ? (totalItemGstAmt / 2) : 0
  const effectiveIgstAmt = taxMode === 'inter' ? totalItemGstAmt : 0

  const othersVal = parseFloat(othersAmt) || 0
  const grandTotal = itemSubTotal + totalItemGstAmt + othersVal

  const handleApplyOthersModal = () => {
    const f = parseFloat(othersCharges.freight) || 0
    const p = parseFloat(othersCharges.packaging) || 0
    const h = parseFloat(othersCharges.handling) || 0
    const ins = parseFloat(othersCharges.insurance) || 0
    const m = parseFloat(othersCharges.misc) || 0
    const sum = f + p + h + ins + m
    setOthersAmt(sum.toFixed(2))
    setShowOthersModal(false)
  }

  const saveNewRefValues = async () => {
    const fields = [
      { key: 'freight',        value: freight },
      { key: 'destination',    value: destination },
      { key: 'paymentTerms',   value: paymentTerms },
      { key: 'testReport',     value: testReport },
      { key: 'project',        value: project },
      { key: 'modeOfDespatch', value: modeOfDespatch },
    ]
    for (const { key, value } of fields) {
      const trimmed = (value || '').trim()
      if (!trimmed) continue
      if (fieldSuggestions[key]?.includes(trimmed)) continue
      const type = FIELD_REF_TYPES[key]
      try {
        const typeRes  = await api.get(`/api/reference-master/${encodeURIComponent(type)}`, { skipGlobalLoader: true })
        const typeJson = typeRes.data
        await api.post('/api/reference-master', { referenceType: type, code: typeJson.nextCode || '001', description: trimmed, updatedBy: form.createdBy || 'Admin' })
        queryClient.invalidateQueries({ queryKey: ['reference-master', type] })
      } catch (err) {
        console.error(`Failed to save ref value for ${type}:`, err)
      }
    }
  }

  const handleSubmit = async () => {
    if (!form.supplierName) { toast.warning('Please select a supplier'); return }
    


    setSubmitting(true)
    showLoader(editPoId ? 'Updating purchase order...' : 'Saving purchase order...')
    try {
      const payload = {
        poNo: form.poNumber,
        financialYear: form.poNumber.split('/')[0] || '',
        poDate: form.poDate,
        etaDate: form.etaDate,
        poType: form.poType,
        supplierId: form.supplierId,
        contactPerson: form.contactPerson,
        contactNumber: form.contactNumber,
        supplierAddress: form.supplierAddress,
        gstNo: form.gstNo,
        supplierRefNo: form.supplierRefNumber,
        discountType: 'None',
        freight: parseFloat(freight) || 0,
        destination, paymentTerms, testReport, project,
        modeOfDespatch, deliveryPeriod, taxTerms, warrantyTerms, discountTerms, remarks,
        subTotal: itemSubTotal,
        cgstPer: taxMode === 'intra' ? (parseFloat(cgstPer) || 9) : 0,
        cgstAmt: effectiveCgstAmt,
        sgstPer: taxMode === 'intra' ? (parseFloat(sgstPer) || 9) : 0,
        sgstAmt: effectiveSgstAmt,
        igstPer: taxMode === 'inter' ? (parseFloat(igstPer) || 18) : 0,
        igstAmt: effectiveIgstAmt,
        othersPer: parseFloat(othersPer) || 0,
        othersAmt: othersVal,
        totalAmount: grandTotal,
        status: 'Pending',
        createdBy: form.createdBy || 'Admin',
        items: items.filter(r => r.itemCode || r.itemName).map(r => ({
          ...r,
          discPer: 0,
          discAmt: 0,
        })),
      }
      
      const res = editPoId 
        ? await api.put(`/api/purchase-master/${editPoId}`, payload) 
        : await api.post('/api/purchase-master', payload)
      
      if (res.data?.success) {
        toast.success(editPoId ? 'Purchase Order updated!' : 'Purchase Order submitted successfully!')
        await saveNewRefValues()
        handleCancel()
        window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PurchaseOrderDetails' } }))
      } else {
        toast.error(res.data?.message || 'Submit failed')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Submit failed')
    } finally {
      setSubmitting(false)
      hideLoader()
    }
  }

  const handleCancel = () => {
    setEditPoId(null)
    setForm({
      supplierId:null, supplierName:'', supplierAddress:'', contactPerson:'', contactNumber:'',
      createdBy:'', gstNo:'', supplierRefNumber:'', showTotalsGrid:false,
      poNumber:'', poDate:nowDatetime, etaDate:nowDatetime, poType:'Purchase Order',
    })
    setItems([emptyItem()])
    setOthersAmt('0')
    setOthersCharges({ freight:'0', packaging:'0', handling:'0', insurance:'0', misc:'0' })
    fetchNextPoNo()
  }

  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      {/* 1. Fixed top header */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Purchase</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">
            {editPoId ? 'Edit - Purchase Order Entry' : 'Create - Purchase Order Entry'}
          </span>
        </div>
      </div>

      {/* 2. Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {/* Main form card */}
        <div className="bg-white rounded border border-slate-200 shadow-sm p-4 space-y-3">
          {/* Row 1: 3-column layout */}
          <div className="grid grid-cols-3 gap-4">

            {/* Column 1 — Supplier Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[140px] shrink-0`}>Supplier Name:</label>
                <select value={form.supplierName} onChange={e => handleSupplierChange(e.target.value)} className={inp()}>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[140px] shrink-0 pt-1`}>Supplier Address:</label>
                <textarea rows={3} value={form.supplierAddress} onChange={e => setField('supplierAddress', e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white" />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[140px] shrink-0`}>Supplier Ref. Number:</label>
                <input value={form.supplierRefNumber} onChange={e => setField('supplierRefNumber', e.target.value)} className={inp()} />
              </div>
            </div>

            {/* Column 2 — Contact Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact Person:</label>
                <input value={form.contactPerson} onChange={e => setField('contactPerson', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact No. :</label>
                <input value={form.contactNumber} onChange={e => setField('contactNumber', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>GST NO. :</label>
                <input value={form.gstNo} onChange={e => setField('gstNo', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Taxation Mode:</label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" name="taxMode" value="intra" checked={taxMode === 'intra'} onChange={() => setTaxMode('intra')} className="accent-[#0097A7]" />
                    <span>Intra-State (CGST + SGST)</span>
                  </label>
                  <label className="flex items-center gap-1.5 text-[12px] cursor-pointer">
                    <input type="radio" name="taxMode" value="inter" checked={taxMode === 'inter'} onChange={() => setTaxMode('inter')} className="accent-[#0097A7]" />
                    <span>Inter-State (IGST)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Column 3 — PO Info + Actions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[100px] shrink-0`}>PO Number:</label>
                <input value={form.poNumber} readOnly className={`${inp()} bg-slate-50`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[100px] shrink-0`}>PO Date & Time:</label>
                <input type="datetime-local" value={form.poDate} onChange={e => setField('poDate', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[100px] shrink-0`}>ETA Date & Time:</label>
                <input type="datetime-local" value={form.etaDate} onChange={e => setField('etaDate', e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[100px] shrink-0`}>PO Type :</label>
                <select value={form.poType} onChange={e => setField('poType', e.target.value)} className={inp()}>
                  {poTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-1 flex-wrap">
                <button
                  onClick={() => {
                    window.__velsonPrPickMode = true
                    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'PrintPurchaseRequest' } }))
                  }}
                  className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors shadow-sm whitespace-nowrap"
                >
                  Pick From Request
                </button>
                <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
                  <Plus className="w-3.5 h-3.5"/> Add Row
                </button>
                <button onClick={() => { if(items.length>1) setItems(r => r.slice(0,-1)) }} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm whitespace-nowrap">
                  <Trash2 className="w-3.5 h-3.5"/> Delete Last Item
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
              <table className="min-w-full text-[12.5px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">S.NO</th>
                    {['Item Code','Pur. Req No','Item Name','Description','HSN Code','UOM','Qty','Unit Price','Amount','GST %','GST Amt','Net Amt','Action'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''} relative`} style={{ zIndex: items.length - idx + 10 }}>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1 w-36 min-w-[150px]">
                        <ItemSearchInput
                          value={row.itemCode}
                          displayField="partNo"
                          placeholder="Search Part No..."
                          className="w-full px-2 py-1 text-[12px] border border-slate-200 rounded bg-white focus:outline-none focus:border-[#0097A7] font-semibold text-[#0097A7]"
                          onChange={(val, item) => handleItemSelect(idx, val, item)}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          type="text"
                          placeholder="Req No"
                          value={row.purchaseReqNo}
                          onChange={e => setItemField(idx, 'purchaseReqNo', e.target.value)}
                          className={`${inp()} w-20 min-w-[75px] font-medium text-center`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={row.itemName}
                          title={row.itemName || ''}
                          onChange={e => setItemField(idx, 'itemName', e.target.value)}
                          className={`${inp()} min-w-[130px] ${row.itemId ? 'bg-slate-50' : ''}`}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <input
                          value={row.description}
                          title={row.description || ''}
                          onChange={e => setItemField(idx, 'description', e.target.value)}
                          className={`${inp()} min-w-[140px] ${row.itemId ? 'bg-slate-50' : ''}`}
                        />
                      </td>
                      <td className="px-1 py-1"><input value={row.hsnCode} onChange={e=>setItemField(idx,'hsnCode',e.target.value)} className={`${inp()} ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.uom} onChange={e=>setItemField(idx,'uom',e.target.value)} className={`${inp()} w-14 ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.qty} onChange={e=>setItemField(idx,'qty',e.target.value)} className={`${inp()} w-14 text-right font-medium`} /></td>
                      <td className="px-1 py-1"><input value={row.unitPrice} onChange={e=>setItemField(idx,'unitPrice',e.target.value)} className={`${inp()} w-20 text-right font-medium`} /></td>
                      <td className="px-1 py-1"><input value={row.amount} readOnly className={`${inp()} bg-slate-50 w-24 text-right font-semibold`} /></td>
                      <td className="px-1 py-1"><input value={row.gstPer} onChange={e=>setItemField(idx,'gstPer',e.target.value)} className={`${inp()} w-14 text-right`} /></td>
                      <td className="px-1 py-1"><input value={row.gstAmt} readOnly className={`${inp()} bg-slate-50 w-20 text-right`} /></td>
                      <td className="px-1 py-1"><input value={row.netAmt} readOnly className={`${inp()} bg-slate-50 w-24 text-right font-bold text-slate-700`} /></td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={() => removeRow(idx)} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom section: 3 columns */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Freight :</label>
                <ComboInput id="freight" value={freight} onChange={e => setFreight(e.target.value)} placeholder="Select or Enter Freight Terms" className={inp()} suggestions={fieldSuggestions.freight} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Destination :</label>
                <ComboInput id="destination" value={destination} onChange={e => setDestination(e.target.value)} placeholder="Select or Enter Destination" className={inp()} suggestions={fieldSuggestions.destination} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Payment Terms :</label>
                <ComboInput id="paymentTerms" value={paymentTerms} onChange={e => setPaymentTerms(e.target.value)} placeholder="Select or Enter Payment Terms" className={inp()} suggestions={fieldSuggestions.paymentTerms} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Test Report :</label>
                <ComboInput id="testReport" value={testReport} onChange={e => setTestReport(e.target.value)} placeholder="Select or Enter Special Instruction" className={inp()} suggestions={fieldSuggestions.testReport} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Project :</label>
                <ComboInput id="project" value={project} onChange={e => setProject(e.target.value)} placeholder="Select or Enter Project" className={inp()} suggestions={fieldSuggestions.project} />
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[120px] shrink-0 pt-1`}>Remark's :</label>
                <textarea rows={2} value={remarks} onChange={e => setRemarks(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white" />
              </div>
            </div>

            {/* Middle column: Mode of Despatch, Delivery Period, Tax Terms, Warranty Terms, Discount Terms */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Mode Of Despatch :</label>
                <ComboInput id="modeOfDespatch" value={modeOfDespatch} onChange={e => setModeOfDespatch(e.target.value)} placeholder="Select or Enter Mode Of Despatch" className={inp()} suggestions={fieldSuggestions.modeOfDespatch} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Delivery Period:</label>
                <input value={deliveryPeriod} onChange={e => setDeliveryPeriod(e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Tax Terms :</label>
                <input value={taxTerms} onChange={e => setTaxTerms(e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Warranty Terms :</label>
                <input value={warrantyTerms} onChange={e => setWarrantyTerms(e.target.value)} className={inp()} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Discount Terms :</label>
                <input value={discountTerms} onChange={e => setDiscountTerms(e.target.value)} className={inp()} />
              </div>
            </div>

            {/* Right column: Totals / Tax */}
            <div className="space-y-2 bg-slate-50 p-3 rounded border border-slate-200">
              <div className="flex items-center justify-between">
                <label className={`${lbl}`}>Item Sub Total :</label>
                <span className="text-[13px] font-bold text-slate-800">{itemSubTotal.toFixed(2)}</span>
              </div>

              {taxMode === 'intra' ? (
                <>
                  <div className="flex items-center justify-between">
                    <label className={`${lbl}`}>CGST ({((items[0] ? parseFloat(items[0].gstPer) || 18 : 18) / 2).toFixed(1)}%) :</label>
                    <span className="text-[12.5px] font-semibold text-slate-700">{effectiveCgstAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className={`${lbl}`}>SGST ({((items[0] ? parseFloat(items[0].gstPer) || 18 : 18) / 2).toFixed(1)}%) :</label>
                    <span className="text-[12.5px] font-semibold text-slate-700">{effectiveSgstAmt.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <label className={`${lbl}`}>IGST ({(items[0] ? parseFloat(items[0].gstPer) || 18 : 18).toFixed(1)}%) :</label>
                  <span className="text-[12.5px] font-semibold text-slate-700">{effectiveIgstAmt.toFixed(2)}</span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <label className={`${lbl}`}>Others Charges :</label>
                  <button
                    type="button"
                    onClick={() => setShowOthersModal(true)}
                    className="px-2 py-0.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded shadow-xs transition-colors"
                  >
                    Others +
                  </button>
                </div>
                <span className="text-[13px] font-bold text-slate-800">{othersVal.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t-2 border-slate-300">
                <label className="text-[13px] font-bold text-slate-800">Grand Total :</label>
                <span className="text-[15px] font-bold text-[#0097A7]">{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Fixed bottom action bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={submitting || !(editPoId ? canEdit : canSave)}
            title={!(editPoId ? canEdit : canSave) ? "You do not have permission to perform this action" : ""}
            className={`flex items-center gap-1.5 px-6 py-2 text-white text-[13px] font-bold rounded shadow transition-all active:scale-95 disabled:opacity-70
              ${!(editPoId ? canEdit : canSave) ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#0097A7] hover:bg-[#007a87]'}`}
          >
            <Send className="w-3.5 h-3.5"/> {editPoId ? 'Update' : 'Submit'}
          </button>
          <button
            onClick={handleCancel}
            disabled={submitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded text-[12px] transition-colors shadow-sm disabled:opacity-40"
          >
            <X className="w-3.5 h-3.5"/> Cancel
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-500">Item Sub Total:</span>
            <span className="text-[14px] font-bold text-slate-700">{itemSubTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <span className="text-[13px] font-semibold text-slate-500">GST (Strict on Sub Total):</span>
            <span className="text-[14px] font-bold text-slate-700">{totalItemGstAmt.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <span className="text-[13px] font-bold text-slate-700">Grand Total:</span>
            <span className="text-[16px] font-bold text-[#0097A7]">{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Others Additional Charges Modal */}
      {showOthersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#0097A7] px-4 py-3 text-white flex items-center justify-between">
              <h3 className="text-[14px] font-bold">Input Additional / Other Charges</h3>
              <button onClick={() => setShowOthersModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-[12.5px]">
              <p className="text-[11.5px] text-slate-500 italic pb-1 border-b border-slate-100">
                Note: GST will strictly NOT be calculated on these additional charges.
              </p>
              <div className="flex items-center justify-between gap-3">
                <label className={lbl}>Freight / Transportation:</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={othersCharges.freight}
                  onChange={e => setOthersCharges(c => ({ ...c, freight: e.target.value }))}
                  className={`${inp()} w-36 text-right`}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className={lbl}>Packaging & Forwarding:</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={othersCharges.packaging}
                  onChange={e => setOthersCharges(c => ({ ...c, packaging: e.target.value }))}
                  className={`${inp()} w-36 text-right`}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className={lbl}>Handling Charges:</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={othersCharges.handling}
                  onChange={e => setOthersCharges(c => ({ ...c, handling: e.target.value }))}
                  className={`${inp()} w-36 text-right`}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className={lbl}>Transit Insurance:</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={othersCharges.insurance}
                  onChange={e => setOthersCharges(c => ({ ...c, insurance: e.target.value }))}
                  className={`${inp()} w-36 text-right`}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <label className={lbl}>Miscellaneous Other Charges:</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={othersCharges.misc}
                  onChange={e => setOthersCharges(c => ({ ...c, misc: e.target.value }))}
                  className={`${inp()} w-36 text-right`}
                />
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Additional Charges:</span>
                <span className="font-bold text-[#0097A7] text-[14px]">
                  {((parseFloat(othersCharges.freight) || 0) +
                    (parseFloat(othersCharges.packaging) || 0) +
                    (parseFloat(othersCharges.handling) || 0) +
                    (parseFloat(othersCharges.insurance) || 0) +
                    (parseFloat(othersCharges.misc) || 0)).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowOthersModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 font-semibold text-[12px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyOthersModal}
                className="px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white rounded font-semibold text-[12px] shadow-sm"
              >
                Apply Charges
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
