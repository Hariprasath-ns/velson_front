import { useState, useEffect, useRef } from 'react'
import { ChevronRight, Plus, Trash2, Send, X, Save } from 'lucide-react'
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

const today = new Date().toISOString().split('T')[0]

const emptyItem = () => ({
  itemId: null, itemCode:'', purchaseReqNo:'', supplierPartNo:'', itemName:'', description:'',
  hsnCode:'', uom:'', qty:'', unitPrice:'', discPer:'', discAmt:'',
  amount:'', gstPer:'', gstAmt:'', netAmt:'',
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

  // React Query hooks for Reference Master
  const { data: suppliersRaw = [] } = useSuppliers()
const { data: purchaseRequestsRaw = [] } = usePurchaseRequests()


  const { data: poTypesRes = [] } = useReferenceMaster('PO Type')
  const { data: poFreightRes = [] } = useReferenceMaster('PO Freight')
  const { data: poDestinationRes = [] } = useReferenceMaster('PO Destination')
  const { data: poPaymentTermsRes = [] } = useReferenceMaster('PO Payment Terms')
  const { data: poTestReportRes = [] } = useReferenceMaster('PO Test Report')
  const { data: poProjectRes = [] } = useReferenceMaster('PO Project')
  const { data: poModeOfDespatchRes = [] } = useReferenceMaster('PO Mode Of Despatch')

  // Map to simple description arrays
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
    poNumber: '', poDate: today, etaDate: today, poType: 'Purchase Order',
    discountType: 'Dis_Per',
  })
  const [items, setItems] = useState([emptyItem()])
  // const [suppliersData, setSuppliersData] = useState([])
  // const [suppliers, setSuppliers] = useState([])
  // const [purchaseRequests, setPurchaseRequests] = useState([])
  const suppliersData = suppliersRaw
const suppliers = suppliersRaw.map(s => s.supplierName)
const purchaseRequests = purchaseRequestsRaw.map(pr => pr.prNo)
  const [submitting, setSubmitting] = useState(false)
  const [fromPRApproval, setFromPRApproval] = useState(false)
  const [editPoId, setEditPoId] = useState(null)

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
      // 1. Fetch suppliers
      // try {
      //   const resSuppliers = await api.get('/api/supplier-master')
      //   if (resSuppliers.data?.success && resSuppliers.data?.data) {
      //     setSuppliersData(resSuppliers.data.data)
      //     setSuppliers(resSuppliers.data.data.map(s => s.supplierName))
      //   }
      // } catch (err) {
      //   console.error('Error fetching suppliers:', err)
      // }

      // 2. Fetch purchase requests
      // try {
      //   const resPR = await api.get('/api/purchase-request')
      //   if (resPR.data?.success && resPR.data?.data) {
      //     setPurchaseRequests(resPR.data.data.map(pr => pr.prNo))
      //   }
      // } catch (err) {
      //   console.error('Error fetching purchase requests:', err)
      // }

      // 3. Edit mode load or prefill/next-no
      const editRaw = localStorage.getItem('velson:po-edit')
      if (editRaw) {
        localStorage.removeItem('velson:po-edit')
        const poId = parseInt(editRaw, 10)
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
              poDate:           po.poDate ? po.poDate.split('T')[0] : today,
              etaDate:          po.etaDate ? po.etaDate.split('T')[0] : today,
              poType:           po.poType          || 'Purchase Order',
              discountType:     po.discountType    || 'Dis_Per',
            }))
            if (po.details?.length > 0) setItems(po.details.map(it => ({ ...emptyItem(), ...it })))
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
              
              // const prefillItems = []
              // if (pr.details?.length > 0) {
              //   for (const d of pr.details) {
              //     const master = await fetchItemMasterByCode(d.itemCode)
              //     const qtyVal = parseFloat(d.qty) || 0
              //     const priceVal = master?.purchaseRate || 0
              //     const amtVal = qtyVal * priceVal
              //     prefillItems.push({
              //       ...emptyItem(),
              //       purchaseReqNo: pr.prNo,
              //       itemId:        master?.id             || null,
              //       itemCode:      d.itemCode             || '',
              //       itemName:      d.itemName             || master?.partName    || '',
              //       description:   d.specification        || master?.description || '',
              //       hsnCode:       master?.hsnCode        || '',
              //       uom:           d.uom                  || master?.uom        || '',
              //       supplierPartNo: master?.outsourcePartNo || '',
              //       qty:           String(d.qty ?? ''),
              //       unitPrice:     master?.purchaseRate != null ? String(master.purchaseRate) : '',
              //       amount:        amtVal > 0 ? amtVal.toFixed(2) : '',
              //       netAmt:        amtVal > 0 ? amtVal.toFixed(2) : '',
              //     })
              //   }
              // } else {
              //   prefillItems.push({ ...emptyItem(), purchaseReqNo: pr.prNo })
              // }
              // setItems(prefillItems)
              // BEFORE (sequential — blocks for each item):



// AFTER (parallel — all at once):
const masters = await Promise.all(
  pr.details.map(d => fetchItemMasterByCode(d.itemCode))
)
const prefillItems = pr.details.map((d, i) => {
  const master = masters[i]
  const qtyVal   = parseFloat(d.qty) || 0
  const priceVal = master?.purchaseRate || 0
  const amtVal   = qtyVal * priceVal
  return {
    ...emptyItem(),
    purchaseReqNo:  pr.prNo,
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
    netAmt:         amtVal > 0 ? amtVal.toFixed(2) : '',
  }
})
setItems(prefillItems)
            }
          } catch (e) {
            console.error('PO PR pick load error:', e)
          }
        } else {
          const raw = localStorage.getItem('velson:po-prefill')
          if (raw) {
            localStorage.removeItem('velson:po-prefill')
            try {
              const prefill = JSON.parse(raw)
              setFromPRApproval(true)
              setForm(f => ({ ...f, poNumber: prefill.poNo, poDate: prefill.poDate }))
              
              // const prefillItems = []
              // if (prefill.items?.length > 0) {
              //   for (const d of prefill.items) {
              //     const master = await fetchItemMasterByCode(d.itemCode)
              //     const qtyVal = parseFloat(d.qty) || 0
              //     const priceVal = master?.purchaseRate || 0
              //     const amtVal = qtyVal * priceVal
              //     prefillItems.push({
              //       ...emptyItem(),
              //       purchaseReqNo: prefill.prNo,
              //       itemId:        master?.id             || null,
              //       itemCode:      d.itemCode             || '',
              //       itemName:      d.itemName             || master?.partName    || '',
              //       description:   d.specification        || master?.description || '',
              //       hsnCode:       master?.hsnCode        || '',
              //       uom:           d.uom                  || master?.uom        || '',
              //       supplierPartNo: master?.outsourcePartNo || '',
              //       qty:           String(d.qty ?? ''),
              //       unitPrice:     master?.purchaseRate != null ? String(master.purchaseRate) : '',
              //       amount:        amtVal > 0 ? amtVal.toFixed(2) : '',
              //       netAmt:        amtVal > 0 ? amtVal.toFixed(2) : '',
              //     })
              //   }
              // } else {
              //   prefillItems.push({ ...emptyItem(), purchaseReqNo: prefill.prNo })
              // }
              // setItems(prefillItems)
              // BEFORE (sequential — blocks for each item):

// AFTER (parallel — all at once):
const masters = await Promise.all(
  pr.details.map(d => fetchItemMasterByCode(d.itemCode))
)
const prefillItems = pr.details.map((d, i) => {
  prefill.items.map(d => fetchItemMasterByCode(d.itemCode))
)
const prefillItems = prefill.items.map((d, i) => {
  const master = masters[i]
  const qtyVal   = parseFloat(d.qty) || 0
  const priceVal = master?.purchaseRate || 0
  const amtVal   = qtyVal * priceVal
  return {
    ...emptyItem(),
    purchaseReqNo:  pr.prNo,
    purchaseReqNo:  prefill.prNo,
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
    netAmt:         amtVal > 0 ? amtVal.toFixed(2) : '',
  }
})
setItems(prefillItems)
            } catch (e) {
              console.error('PO prefill parse error:', e)
            }
          } else {
            // Normal new PO — fetch next number
            await fetchNextPoNo()
          }
        }
      }
    }

    loadData()
  }, [])

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
  const [othersPer, setOthersPer] = useState('0')
  const [othersAmt, setOthersAmt] = useState('0')
  const [cgstPer, setCgstPer] = useState('0')
  const [cgstAmt, setCgstAmt] = useState('0')
  const [sgstPer, setSgstPer] = useState('0')
  const [sgstAmt, setSgstAmt] = useState('0')
  const [igstPer, setIgstPer] = useState('0')
  const [igstAmt, setIgstAmt] = useState('0')

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

  const handleItemSelect = (idx, val, item) => {
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      if (!item) {
        return { ...r, itemCode: val }
      }
      let updated = {
        ...r,
        itemId: item.id,
        itemCode: item.partNo || '',
        itemName: item.partName || '',
        description: item.description || '',
        hsnCode: item.hsnCode || '',
        uom: item.uom || '',
        supplierPartNo: item.outsourcePartNo || '',
        unitPrice: item.purchaseRate != null ? String(item.purchaseRate) : ''
      }
      const q = parseFloat(updated.qty) || 0
      const p = parseFloat(updated.unitPrice) || 0
      const rawAmt = q * p
      const dp = parseFloat(updated.discPer) || 0
      const da = rawAmt * dp / 100
      updated.discAmt = da.toFixed(2)
      updated.amount = (rawAmt - da).toFixed(2)
      const gp = parseFloat(updated.gstPer) || 0
      const ga = (rawAmt - da) * gp / 100
      updated.gstAmt = ga.toFixed(2)
      updated.netAmt = (rawAmt - da + ga).toFixed(2)
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
      const dp = parseFloat(k === 'discPer' ? v : updated.discPer) || 0
      const da = rawAmt * dp / 100
      updated.discAmt = da.toFixed(2)
      updated.amount = (rawAmt - da).toFixed(2)
      const gp = parseFloat(k === 'gstPer' ? v : updated.gstPer) || 0
      const ga = (rawAmt - da) * gp / 100
      updated.gstAmt = ga.toFixed(2)
      updated.netAmt = (rawAmt - da + ga).toFixed(2)
      return updated
    }))
  }

  const addRow = () => setItems(r => [...r, emptyItem()])
  const removeRow = idx => setItems(r => r.filter((_, i) => i !== idx))

  const subTotal = items.reduce((s, r) => s + (parseFloat(r.netAmt) || 0), 0)
  const grandTotal = subTotal +
    (parseFloat(othersAmt) || 0) +
    (parseFloat(cgstAmt) || 0) +
    (parseFloat(sgstAmt) || 0) +
    (parseFloat(igstAmt) || 0)

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
        
        // Invalidate query to refresh React Query cache
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
        discountType: form.discountType,
        freight, destination, paymentTerms, testReport, project,
        modeOfDespatch, deliveryPeriod, taxTerms, warrantyTerms, discountTerms, remarks,
        subTotal, cgstPer, cgstAmt, sgstPer, sgstAmt,
        igstPer, igstAmt, othersPer, othersAmt,
        totalAmount: grandTotal,
        status: 'Pending',
        createdBy: form.createdBy || 'Admin',
        items,
      }
      
      const res = editPoId 
        ? await api.put(`/api/purchase-master/${editPoId}`, payload) 
        : await api.post('/api/purchase-master', payload)
      
      if (res.data?.success) {
        toast.success(editPoId ? 'Purchase Order updated!' : 'Purchase Order submitted successfully!')
        await saveNewRefValues()
        const targetPage = 'PurchaseOrderDetails'
        handleCancel()
        window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: targetPage } }))
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
    setFromPRApproval(false)
    setEditPoId(null)
    setForm({
      supplierId:null, supplierName:'', supplierAddress:'', contactPerson:'', contactNumber:'',
      createdBy:'', gstNo:'', supplierRefNumber:'', showTotalsGrid:false,
      poNumber:'', poDate:today, etaDate:today, poType:'Purchase Order',
      discountType:'Dis_Per',
    })
    setItems([emptyItem()])
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
        <button className="px-3 py-1 bg-[#0097A7] text-white text-[12px] rounded hover:bg-[#007a87] transition-colors font-semibold">Draft</button>
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
              {/* Discount type radio */}
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}></label>
                <div className="flex items-center gap-3">
                  {['Dis_Per','Dis_Amt'].map(v => (
                    <label key={v} className="flex items-center gap-1 text-[12.5px] cursor-pointer">
                      <input type="radio" name="discountType" value={v} checked={form.discountType===v} onChange={() => setField('discountType', v)} className="accent-[#0097A7]" />
                      {v === 'Dis_Per' ? 'Dis. Per' : 'Dis. Amt'}
                    </label>
                  ))}
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
                <label className={`${lbl} w-[100px] shrink-0`}>PO Date:</label>
                <input type="date" value={form.poDate} className={inp()} readOnly/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[100px] shrink-0`}>ETA Date :</label>
                <input type="date" value={form.etaDate} onChange={e => setField('etaDate', e.target.value)} className={inp()} />
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
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">S.NO</th>
                    {['Item Code','Purchase Req No','Item Name','Description','HSN Code','UOM','Qty','Unit Price','Disc %','Disc Amt','Amount','GST %','GST Amt','Net Amt','Action'].map(h => (
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1">
                        <ItemSearchInput
                          value={row.itemCode}
                          displayField="partNo"
                          placeholder="Search Item Code"
                          className={inp()}
                          onChange={(val, item) => handleItemSelect(idx, val, item)}
                        />
                      </td>
                      <td className="px-1 py-1">
                        <select value={row.purchaseReqNo} onChange={e=>setItemField(idx,'purchaseReqNo',e.target.value)} className={inp()}>
                          <option value="">Select PR No</option>
                          {purchaseRequests.map(pr => <option key={pr} value={pr}>{pr}</option>)}
                        </select>
                      </td>
                      <td className="px-1 py-1"><input value={row.itemName} onChange={e=>setItemField(idx,'itemName',e.target.value)} className={`${inp()} ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.description} onChange={e=>setItemField(idx,'description',e.target.value)} className={`${inp()} min-w-[120px] ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.hsnCode} onChange={e=>setItemField(idx,'hsnCode',e.target.value)} className={`${inp()} ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.uom} onChange={e=>setItemField(idx,'uom',e.target.value)} className={`${inp()} w-14 ${row.itemId?'bg-slate-50':''}`} /></td>
                      <td className="px-1 py-1"><input value={row.qty} onChange={e=>setItemField(idx,'qty',e.target.value)} className={`${inp()} w-14`} /></td>
                      <td className="px-1 py-1"><input value={row.unitPrice} onChange={e=>setItemField(idx,'unitPrice',e.target.value)} className={`${inp()} w-20`} /></td>
                      <td className="px-1 py-1"><input value={row.discPer} onChange={e=>setItemField(idx,'discPer',e.target.value)} className={`${inp()} w-14`} /></td>
                      <td className="px-1 py-1"><input value={row.discAmt} readOnly className={`${inp()} bg-slate-50 w-16`} /></td>
                      <td className="px-1 py-1"><input value={row.amount} readOnly className={`${inp()} bg-slate-50 w-20`} /></td>
                      <td className="px-1 py-1"><input value={row.gstPer} onChange={e=>setItemField(idx,'gstPer',e.target.value)} className={`${inp()} w-14`} /></td>
                      <td className="px-1 py-1"><input value={row.gstAmt} readOnly className={`${inp()} bg-slate-50 w-16`} /></td>
                      <td className="px-1 py-1"><input value={row.netAmt} readOnly className={`${inp()} bg-slate-50 w-20`} /></td>
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
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[80px] shrink-0`}>Sub Total :</label>
                <span className="text-[13px] font-semibold text-slate-700 ml-auto">{subTotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[80px] shrink-0`}>Others :</label>
                <span className="text-[12px] text-slate-500 ml-auto">%</span>
                <input value={othersPer} onChange={e => setOthersPer(e.target.value)} className={`${inp()} w-14`} />
                <input value={othersAmt} onChange={e => setOthersAmt(e.target.value)} className={`${inp()} w-20`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[80px] shrink-0`}>CGST :</label>
                <span className="text-[12px] text-slate-500 ml-auto">%</span>
                <input value={cgstPer} onChange={e => setCgstPer(e.target.value)} className={`${inp()} w-14`} />
                <input value={cgstAmt} onChange={e => setCgstAmt(e.target.value)} className={`${inp()} w-20`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[80px] shrink-0`}>SGST :</label>
                <span className="text-[12px] text-slate-500 ml-auto">%</span>
                <input value={sgstPer} onChange={e => setSgstPer(e.target.value)} className={`${inp()} w-14`} />
                <input value={sgstAmt} onChange={e => setSgstAmt(e.target.value)} className={`${inp()} w-20`} />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[80px] shrink-0`}>IGST :</label>
                <span className="text-[12px] text-slate-500 ml-auto">%</span>
                <input value={igstPer} onChange={e => setIgstPer(e.target.value)} className={`${inp()} w-14`} />
                <input value={igstAmt} onChange={e => setIgstAmt(e.target.value)} className={`${inp()} w-20`} />
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
            <span className="text-[13px] font-semibold text-slate-500">Sub Total:</span>
            <span className="text-[14px] font-bold text-slate-700">{subTotal.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-6">
            <span className="text-[13px] font-bold text-slate-700">Grand Total:</span>
            <span className="text-[16px] font-bold text-[#0097A7]">{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}