import { useState, useEffect } from 'react'
import api from '../services/api'
import { ChevronRight, Plus, Trash2, Send, X, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { SpinnerLoader } from '../components/LocalLoader'

// Currencies fetched from reference master
const CURRENCY_TYPES = ['EXPORT','DOMESTIC']
// Tax Types are fetched dynamically from reference master (see useEffect below)
// Default tax % per Tax Type description (case-insensitive match)
const TAX_RATE_MAP = { 'LOCAL': 18, 'INTER': 28 }
// QC Types fetched from reference master

const today = new Date().toISOString().split('T')[0]

const emptyItem = () => ({ itemCode:'', itemName:'', supplierPartNo:'', description:'', hsnCode:'', unit:'', stockQty:'', orderQty:'', qty:'', unitPrice:'', total:'', discPer:'', discAmt:'', finalPrice:'', taxPer:'', netAmt:'' })
const emptyFreightRow = () => ({ freightName:'', amount:'', taxPer:'', gstAmt:'0', igstAmt:'0', netTotal:'0' })

const DEFAULT_FREIGHT_NAMES = [
  'Freight Inward',
  'Freight Outward',
  'Gas cutting Charge',
  'HANDLING CHARGES',
  'OTHERS',
  'Packing and forwading',
  'TESTING CHARGES',
  'Accommodation Charges',
]
const defaultFreightRows = () => DEFAULT_FREIGHT_NAMES.map(name => ({ ...emptyFreightRow(), freightName: name }))

const inp = (err='') => `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err?'border-red-400 focus:ring-red-300':'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

export default function GRNEntry() {
  const toast = useToast()
  const [grnTypes, setGrnTypes] = useState([])
  const [taxTypes, setTaxTypes] = useState([])
  const [purchaseLedgers, setPurchaseLedgers] = useState([])
  const [purchaseTypes, setPurchaseTypes] = useState([])
  const [qcTypes, setQcTypes] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [refLoading, setRefLoading] = useState(true)
  const [itemsLoading, setItemsLoading] = useState(false)
  const [editId, setEditId] = useState(null)
  const [suppliersData, setSuppliersData] = useState([])

  useEffect(() => {
    setRefLoading(true)
    const fetches = [
      api.get(`/api/reference-master/${encodeURIComponent('GRN_Type')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setGrnTypes(types)
          if (types.length) setForm(f => ({ ...f, grnType: f.grnType || types[0] }))
        }).catch(() => {}),

      api.get(`/api/reference-master/${encodeURIComponent('Tax Type')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setTaxTypes(types)
          if (types.length) setForm(f => ({ ...f, taxType: f.taxType || types[0] }))
        }).catch(() => {}),

      api.get(`/api/reference-master/${encodeURIComponent('Purchase_Ledger')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setPurchaseLedgers(types)
          if (types.length) setForm(f => ({ ...f, purchaseLedger: f.purchaseLedger || types[0] }))
        }).catch(() => {}),

      api.get('/api/supplier-master', { skipGlobalLoader: true })
        .then(res => {
          setSuppliersData(res.data.data || [])
        }).catch(() => {}),

      api.get(`/api/reference-master/${encodeURIComponent('PAYMODE')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setPurchaseTypes(types)
          if (types.length) setForm(f => ({ ...f, purchaseType: f.purchaseType || types[0] }))
        }).catch(() => {}),

      api.get(`/api/reference-master/${encodeURIComponent('QC_Type')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setQcTypes(types)
          if (types.length) setForm(f => ({ ...f, qcType: f.qcType || types[0] }))
        }).catch(() => {}),

      api.get(`/api/reference-master/${encodeURIComponent('Currency')}`, { skipGlobalLoader: true })
        .then(res => {
          const types = (res.data.data || []).map(r => r.description || r.code).filter(Boolean)
          setCurrencies(types)
          if (types.length) setForm(f => ({ ...f, currency: f.currency || types[0] }))
        }).catch(() => {}),
    ]

    const nav = window.__velsonNav || {}
    window.__velsonNav = null
    if (nav.editId) {
      Promise.allSettled(fetches).finally(() => loadForEdit(nav.editId))
    } else {
      // Fetch next GRN number for new entry
      api.get('/api/grn-master/next-no', { skipGlobalLoader: true })
        .then(res => {
          if (res.data.grnNo) {
            setForm(f => ({ ...f, grnNo: res.data.grnNo, financialYear: res.data.financialYear || '' }))
          }
        })
        .catch(() => {})
      Promise.allSettled(fetches).finally(() => setRefLoading(false))
    }
  }, [])

  const loadForEdit = async (id) => {
    try {
      const res = await api.get(`/api/grn-master/${id}`, { skipGlobalLoader: true })
      const grn = res.data.data
      if (!grn) return
      setEditId(grn.id)
      setForm({
        grnType:       grn.grnType       || '',
        gateEntryNo:   grn.gateEntryNo   || '',
        supplierName:  grn.supplierName  || '',
        purchaseLedger:grn.purchaseLedger|| '',
        purchaseType:  grn.purchaseType  || '',
        currency:      grn.currency      || '',
        currencyType:  grn.currencyType  || 'EXPORT',
        contactPerson: grn.contactPerson || '',
        contactNo:     grn.contactNo     || '',
        poNo:          grn.poNo          || '',
        poDate:        grn.poDate ? grn.poDate.split('T')[0] : today,
        taxType:       grn.taxType       || '',
        exchangeRate:  grn.exchangeRate != null ? String(grn.exchangeRate) : '',
        grnNo:         grn.grnNo,
        financialYear: grn.financialYear || '',
        grnDate:       grn.grnDate ? grn.grnDate.split('T')[0] : today,
        invoiceNo:     grn.invoiceNo     || '0',
        invoiceDate:   grn.invoiceDate ? grn.invoiceDate.split('T')[0] : today,
        qcType:        grn.qcType        || '',
        discountType:  grn.discountType  || 'Dis_Per',
      })
      setRemarks(grn.remarks || '')
      setCurrencyTotal(grn.currencyTotal != null ? String(grn.currencyTotal) : '')
      setRoundOff(grn.roundOff != null ? String(grn.roundOff) : '')
      setFreightLedger(grn.freightLedger || 'FREIGHT A/C')
      setTcsLedger(grn.tcsLedger || 'TCS A/C')
      setOthersAmt(grn.othersAmt != null ? String(grn.othersAmt) : '')
      setOgstAmtVal(grn.ogstAmt != null ? String(grn.ogstAmt) : '')
      setTcsAmtVal(grn.tcsAmt != null ? String(grn.tcsAmt) : '')
      setItems(grn.details?.length > 0 ? grn.details.map(d => ({
        itemCode:       d.itemCode       || '',
        itemName:       d.itemName       || '',
        supplierPartNo: d.supplierPartNo || '',
        description:    d.description   || '',
        hsnCode:        d.hsnCode        || '',
        unit:           d.unit           || '',
        stockQty:       d.stockQty != null ? String(d.stockQty) : '',
        orderQty:       d.orderQty != null ? String(d.orderQty) : '',
        qty:            d.qty      != null ? String(d.qty)      : '',
        unitPrice:      d.unitPrice!= null ? String(d.unitPrice): '',
        total:          d.total    != null ? String(d.total)    : '',
        discPer:        d.discPer  != null ? String(d.discPer)  : '',
        discAmt:        d.discAmt  != null ? String(d.discAmt)  : '',
        finalPrice:     d.finalPrice!=null ? String(d.finalPrice): '',
        taxPer:         d.taxPer   != null ? String(d.taxPer)   : '',
        netAmt:         d.netAmt   != null ? String(d.netAmt)   : '',
      })) : [emptyItem()])
    } catch {
      toast.error('Failed to load GRN entry for editing')
    } finally {
      setRefLoading(false)
    }
  }

  const [form, setForm] = useState({
    grnType:'', gateEntryNo:'', supplierName:'', purchaseLedger:'',
    purchaseType:'', currency:'', currencyType:'EXPORT',
    contactPerson:'', contactNo:'', poNo:'', poDate:today, taxType:'', exchangeRate:'',
    grnNo:'', financialYear:'', grnDate:today, invoiceNo:'0', invoiceDate:today, qcType:'',
    discountType:'Dis_Per',
  })
  const [items, setItems] = useState([emptyItem()])
  const [remarks, setRemarks] = useState('')
  const [currencyTotal, setCurrencyTotal] = useState('')
  const [roundOff, setRoundOff] = useState('')
  const [freightLedger, setFreightLedger] = useState('FREIGHT A/C')
  const [tcsLedger, setTcsLedger] = useState('TCS A/C')

  const [showFreightPopup, setShowFreightPopup] = useState(false)
  const [freightRows, setFreightRows] = useState(defaultFreightRows())
  const [othersAmt, setOthersAmt] = useState('')
  const [ogstAmtVal, setOgstAmtVal] = useState('')
  const [tcsAmtVal, setTcsAmtVal] = useState('')

  const [showGateModal, setShowGateModal] = useState(false)
  const [gateEntries, setGateEntries] = useState([])
  const [gateSearch, setGateSearch] = useState('')
  const [gateLoading, setGateLoading] = useState(false)

  const openGateSearch = () => {
    setShowGateModal(true)
    setGateSearch('')
    setGateLoading(true)
    api.get('/api/gate-master', { skipGlobalLoader: true })
      .then(res => setGateEntries(res.data.data || []))
      .catch(() => setGateEntries([]))
      .finally(() => setGateLoading(false))
  }

  const calcItemRow = (row) => {
    const q = parseFloat(row.qty) || 0
    const up = parseFloat(row.unitPrice) || 0
    const tot = q * up
    const dp = parseFloat(row.discPer) || 0
    const da = tot * dp / 100
    const tp = parseFloat(row.taxPer) || 0
    return { ...row, total: tot.toFixed(2), discAmt: da.toFixed(2), finalPrice: (tot - da).toFixed(2), netAmt: ((tot - da) * (1 + tp / 100)).toFixed(2) }
  }

  const handleSupplierChange = (name) => {
    const sup = suppliersData.find(s => s.supplierName === name)
    setForm(f => ({
      ...f,
      supplierName: name,
      ...(sup ? {
        contactPerson: sup.contactPerson || f.contactPerson,
        contactNo: sup.mobile || sup.phone || f.contactNo,
        purchaseLedger: sup.purchaseLedger || f.purchaseLedger,
      } : {})
    }))
  }

  const selectGateEntry = (entry) => {
    const gateSupplierName = entry.supplierName || ''
    const sup = suppliersData.find(s => s.supplierName === gateSupplierName)

    setForm(f => ({
      ...f,
      gateEntryNo: entry.gateEntryNo,
      supplierName: gateSupplierName,
      poNo: entry.poNo || '',
      invoiceNo: entry.invoiceNo || '',
      invoiceDate: entry.invoiceDate ? entry.invoiceDate.split('T')[0] : f.invoiceDate,
      ...(sup ? {
        purchaseLedger: sup.purchaseLedger || f.purchaseLedger,
      } : {})
    }))
    const gateItems = (entry.details || []).map(d => ({
      ...emptyItem(),
      itemCode: d.itemCode || '',
      itemName: d.itemName || '',
      supplierPartNo: d.supplierPartNo || '',
      description: d.description || '',
      hsnCode: d.hsnCode || '',
      unit: d.unit || '',
      orderQty: String(d.qty || ''),
      qty: String(d.recQty || ''),
    }))
    if (entry.poId) {
      setItemsLoading(true)
      api.get(`/api/purchase-master/${entry.poId}`, { skipGlobalLoader: true })
        .then(res => {
          const po = res.data.data
          if (!po) { if (gateItems.length) setItems(gateItems); return }
          setForm(f => ({
            ...f,
            contactPerson: po.contactPerson || '',
            contactNo: po.contactNumber || po.supplier?.mobile || po.supplier?.phone || '',
            poDate: po.poDate ? po.poDate.split('T')[0] : f.poDate,
            purchaseLedger: po.supplier?.purchaseLedger || f.purchaseLedger,
            supplierName: po.supplier?.supplierName || f.supplierName,
          }))
          // Enrich gate items with unitPrice, discPer, taxPer from PO details
          if (po.details && po.details.length && gateItems.length) {
            setItems(gateItems.map(gi => {
              const pd = po.details.find(d => d.itemCode === gi.itemCode)
              if (!pd) return gi
              return calcItemRow({
                ...gi,
                unitPrice: String(pd.unitPrice || ''),
                discPer: String(pd.discPer || ''),
                taxPer: String(pd.gstPer || ''),
              })
            }))
          } else if (gateItems.length) {
            setItems(gateItems)
          }
        })
        .catch(() => { if (gateItems.length) setItems(gateItems) })
        .finally(() => setItemsLoading(false))
    } else if (gateItems.length) {
      setItems(gateItems)
    }
    setShowGateModal(false)
  }

  const filteredGateEntries = gateEntries.filter(e => {
    const q = gateSearch.toLowerCase()
    return !q || (e.gateEntryNo||'').toLowerCase().includes(q)
      || (e.supplierName||'').toLowerCase().includes(q)
      || (e.poNo||'').toLowerCase().includes(q)
      || (e.invoiceNo||'').toLowerCase().includes(q)
  })

  const [showPoModal, setShowPoModal] = useState(false)
  const [poList, setPoList] = useState([])
  const [poSearch, setPoSearch] = useState('')
  const [poLoading, setPoLoading] = useState(false)

  const openPoSearch = () => {
    setShowPoModal(true)
    setPoSearch('')
    setPoLoading(true)
    api.get('/api/purchase-master', { skipGlobalLoader: true })
      .then(res => setPoList(res.data.data || []))
      .catch(() => setPoList([]))
      .finally(() => setPoLoading(false))
  }

  const selectPo = (po) => {
    setForm(f => ({
      ...f,
      poNo: po.poNo || '',
      poDate: po.poDate ? po.poDate.split('T')[0] : f.poDate,
      contactPerson: po.contactPerson || '',
      contactNo: po.contactNumber || po.supplier?.mobile || po.supplier?.phone || '',
      supplierName: po.supplier?.supplierName || f.supplierName,
      purchaseLedger: po.supplier?.purchaseLedger || f.purchaseLedger,
    }))
    // Populate items from PO details (itemCode, itemName, unitPrice, etc.)
    if (po.details && po.details.length) {
      setItems(po.details.map(d => calcItemRow({
        ...emptyItem(),
        itemCode: d.itemCode || '',
        itemName: d.itemName || '',
        supplierPartNo: d.supplierPartNo || '',
        description: d.description || '',
        hsnCode: d.hsnCode || '',
        unit: d.uom || '',
        orderQty: String(d.qty || ''),
        qty: String(d.qty || ''),
        unitPrice: String(d.unitPrice || ''),
        discPer: String(d.discPer || ''),
        taxPer: String(d.gstPer || ''),
      })))
    }
    setShowPoModal(false)
  }

  const filteredPoList = poList.filter(p => {
    const q = poSearch.toLowerCase()
    return !q || (p.poNo||'').toLowerCase().includes(q)
      || (p.supplier?.supplierName||'').toLowerCase().includes(q)
      || (p.contactPerson||'').toLowerCase().includes(q)
  })

  const applyTaxRate = (rate) => {
    setItems(rows => rows.map(r => {
      const q = parseFloat(r.qty) || 0
      const p = parseFloat(r.unitPrice) || 0
      const tot = q * p
      const dp = parseFloat(r.discPer) || 0
      const da = tot * dp / 100
      const finalPrice = (tot - da).toFixed(2)
      const netAmt = ((tot - da) * (1 + rate / 100)).toFixed(2)
      return { ...r, taxPer: String(rate), finalPrice, netAmt }
    }))
  }

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'taxType') {
      const rate = TAX_RATE_MAP[v.toUpperCase()]
      if (rate !== undefined) applyTaxRate(rate)
    }
  }

  const setItemField = (idx,k,v) => {
    setItems(rows=>rows.map((r,i)=>{
      if(i!==idx) return r
      const u={...r,[k]:v}
      const q=parseFloat(k==='qty'?v:u.qty)||0
      const p=parseFloat(k==='unitPrice'?v:u.unitPrice)||0
      const tot=q*p; u.total=tot.toFixed(2)
      const dp=parseFloat(k==='discPer'?v:u.discPer)||0
      const da=tot*dp/100; u.discAmt=da.toFixed(2)
      u.finalPrice=(tot-da).toFixed(2)
      const tp=parseFloat(k==='taxPer'?v:u.taxPer)||0
      u.netAmt=((tot-da)*(1+tp/100)).toFixed(2)
      return u
    }))
  }

  const addRow = () => setItems(r=>[...r,emptyItem()])
  const removeRow = idx => setItems(r=>r.filter((_,i)=>i!==idx))

  const subTotal = items.reduce((s,r)=>s+(parseFloat(r.finalPrice)||0),0)

  const isInterTax = (form.taxType || '').toUpperCase().includes('INTER')
  const totalItemTaxAmt = items.reduce((s,r) => s + ((parseFloat(r.netAmt)||0) - (parseFloat(r.finalPrice)||0)), 0)
  const computedGstAmt = isInterTax ? 0 : totalItemTaxAmt
  const computedIgstAmt = isInterTax ? totalItemTaxAmt : 0
  const grandTotal = subTotal + computedGstAmt + computedIgstAmt
    + parseFloat(ogstAmtVal || 0) + parseFloat(othersAmt || 0)
    + parseFloat(tcsAmtVal || 0) - parseFloat(roundOff || 0)

  const calcFreightRow = (row) => {
    const amt = parseFloat(row.amount) || 0
    const tp = parseFloat(row.taxPer) || 0
    const taxAmt = amt * tp / 100
    const gstAmt = isInterTax ? 0 : taxAmt
    const igstAmt = isInterTax ? taxAmt : 0
    return { ...row, gstAmt: gstAmt.toFixed(2), igstAmt: igstAmt.toFixed(2), netTotal: (amt + gstAmt + igstAmt).toFixed(2) }
  }

  const setFreightRowField = (idx, k, v) => {
    setFreightRows(rows => rows.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [k]: v }
      return (k === 'amount' || k === 'taxPer') ? calcFreightRow(updated) : updated
    }))
  }

  const freightPopupTotal = freightRows.reduce((s, r) => s + (parseFloat(r.netTotal) || 0), 0)

  const freightBaseTotal = freightRows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)

  const applyFreightCharges = () => {
    setOthersAmt(freightBaseTotal.toFixed(2))
    setOgstAmtVal((freightPopupTotal - freightBaseTotal).toFixed(2))
    setShowFreightPopup(false)
  }

  const handleSubmit = async () => {
    if (!form.grnNo) {
      toast.error('GRN number is required')
      return
    }
    if (!form.supplierName) {
      toast.error('Supplier Name is required')
      return
    }
    const validItems = items.filter(r => r.itemCode || r.itemName)
    if (validItems.length === 0) {
      toast.error('Add at least one item')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...form,
        remarks,
        currencyTotal,
        roundOff,
        freightLedger,
        tcsLedger,
        subTotal: subTotal.toFixed(2),
        gstAmt: computedGstAmt.toFixed(2),
        igstAmt: computedIgstAmt.toFixed(2),
        othersAmt,
        ogstAmt: ogstAmtVal,
        tcsAmt: tcsAmtVal,
        grandTotal: grandTotal.toFixed(2),
        totalAmount: grandTotal.toFixed(2),
        items: validItems,
      }
      if (editId) {
        await api.put(`/api/grn-master/${editId}`, payload, { loadingMessage: 'Updating GRN entry...' })
        toast.success('GRN Entry updated successfully!')
        setEditId(null)
      } else {
        await api.post('/api/grn-master', payload, { loadingMessage: 'Saving GRN entry...' })
        toast.success('GRN Entry saved successfully!')
      }

      // Fetch new GRN number for next entry
      const nextRes = await api.get('/api/grn-master/next-no', { skipGlobalLoader: true })
      setForm(f => ({
        grnType: f.grnType,
        gateEntryNo: '',
        supplierName: '',
        purchaseLedger: f.purchaseLedger,
        purchaseType: f.purchaseType,
        currency: f.currency,
        currencyType: 'EXPORT',
        contactPerson: '',
        contactNo: '',
        poNo: '',
        poDate: today,
        taxType: f.taxType,
        exchangeRate: '',
        grnNo: nextRes.data.grnNo || f.grnNo,
        financialYear: nextRes.data.financialYear || f.financialYear,
        grnDate: today,
        invoiceNo: '0',
        invoiceDate: today,
        qcType: f.qcType,
        discountType: 'Dis_Per',
      }))
      setItems([emptyItem()])
      setRemarks('')
      setCurrencyTotal('')
      setRoundOff('')
      setOthersAmt('')
      setFreightRows(defaultFreightRows())
      setOgstAmtVal('')
      setTcsAmtVal('')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save GRN entry'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        {/* <span className="hover:text-[#0097A7] cursor-pointer">Dashboard</span> */}
        {/* <ChevronRight className="w-3 h-3"/> */}
        <span className="hover:text-[#0097A7] cursor-pointer">Stores</span>
        <ChevronRight className="w-3 h-3"/>
        <span className="text-[#0097A7] font-semibold">GRN Entry</span>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <h2 className="text-white font-semibold text-[14px]">{editId ? 'Edit' : 'Create'} - GRN Entry</h2>
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">Close</button>
        </div>

        {refLoading && (
          <div className="bg-slate-50 border-b border-slate-200">
            <SpinnerLoader size={16} message="Loading reference data..." className="py-3" />
          </div>
        )}

        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-4">
            {/* Col 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>GRN Type :</label>
                <select value={form.grnType} onChange={e=>setField('grnType',e.target.value)} className={inp()}>{grnTypes.map(t=><option key={t}>{t}</option>)}</select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Gate Entry No :</label>
                <input value={form.gateEntryNo} readOnly className={`${inp()} flex-1 bg-slate-50`}/>
                <button onClick={openGateSearch} disabled={gateLoading} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[12px] rounded transition-colors shrink-0 flex items-center gap-1 disabled:opacity-60">
                  {gateLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : null}Search
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Supplier Name:</label>
                <select value={form.supplierName} onChange={e=>handleSupplierChange(e.target.value)} className={inp()}>
                  <option value="">Select Supplier</option>
                  {suppliersData.map(s=><option key={s.id} value={s.supplierName}>{s.supplierName}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Purchase Ledger :</label>
                <select value={form.purchaseLedger} onChange={e=>setField('purchaseLedger',e.target.value)} className={inp()}>
                  {purchaseLedgers.length === 0 && <option value="">Loading...</option>}
                  {purchaseLedgers.map(l=><option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Purchase Type :</label>
                <select value={form.purchaseType} onChange={e=>setField('purchaseType',e.target.value)} className={inp()}>
                  {purchaseTypes.length === 0 && <option value="">Loading...</option>}
                  {purchaseTypes.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Currency :</label>
                <select value={form.currency} onChange={e=>setField('currency',e.target.value)} className={`${inp()} w-20`}>
                  {currencies.length === 0 && <option value="">Loading...</option>}
                  {currencies.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
                <select value={form.currencyType} onChange={e=>setField('currencyType',e.target.value)} className={`${inp()} w-24`}>{CURRENCY_TYPES.map(c=><option key={c}>{c}</option>)}</select>
              </div>
            </div>
            {/* Col 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact Person:</label>
                <input value={form.contactPerson} onChange={e=>setField('contactPerson',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact No. :</label>
                <input value={form.contactNo} onChange={e=>setField('contactNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>PO No :</label>
                <input value={form.poNo} readOnly className={`${inp()} flex-1 bg-slate-50`}/>
                <button onClick={openPoSearch} disabled={poLoading} className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-[12px] rounded transition-colors shrink-0 flex items-center gap-1 disabled:opacity-60">
                  {poLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : null}Search
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>PO Date :</label>
                <input type="date" value={form.poDate} onChange={e=>setField('poDate',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Tax Type :</label>
                <select value={form.taxType} onChange={e=>setField('taxType',e.target.value)} className={inp()}>
                  {taxTypes.length === 0 && <option value="">Loading...</option>}
                  {taxTypes.map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Exchange Rate (Rs.):</label>
                <input value={form.exchangeRate} onChange={e=>setField('exchangeRate',e.target.value)} className={inp()}/>
              </div>
            </div>
            {/* Col 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}>GRN No :</label>
                <input value={form.grnNo} readOnly className={`${inp()} bg-slate-50`}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}>GRN Date :</label>
                <input type="date" value={form.grnDate} onChange={e=>setField('grnDate',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}>Invoice No :</label>
                <input value={form.invoiceNo} onChange={e=>setField('invoiceNo',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}>Invoice Date :</label>
                <input type="date" value={form.invoiceDate} onChange={e=>setField('invoiceDate',e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}>QC Type :</label>
                <select value={form.qcType} onChange={e=>setField('qcType',e.target.value)} className={inp()}>
                  {qcTypes.length === 0 && <option value="">Loading...</option>}
                  {qcTypes.map(q=><option key={q} value={q}>{q}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[110px] shrink-0`}></label>
                <div className="flex items-center gap-3">
                  {['Dis_Per','Dis_Amt'].map(v=>(
                    <label key={v} className="flex items-center gap-1 text-[12.5px] cursor-pointer">
                      <input type="radio" name="discType" value={v} checked={form.discountType===v} onChange={()=>setField('discountType',v)} className="accent-[#0097A7]"/>
                      {v==='Dis_Per'?'Dis Per':'Dis Amt'}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={addRow} className="flex items-center gap-1 px-3 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors shadow-sm"><Plus className="w-3.5 h-3.5"/> Add Row</button>
                <button onClick={()=>{if(items.length>1)setItems(r=>r.slice(0,-1))}} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm whitespace-nowrap"><Trash2 className="w-3.5 h-3.5"/> Delete Selected Item</button>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="mt-2">
            <div className="bg-slate-700 px-3 py-1.5 rounded-t flex items-center justify-between">
              <h3 className="text-white text-[13px] font-semibold">Items</h3>
              {itemsLoading && (
                <span className="flex items-center gap-1.5 text-white/80 text-[11px]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Loading items from PO...
                </span>
              )}
            </div>
            <div className="overflow-x-auto border border-slate-200 rounded-b relative">
              {itemsLoading && (
                <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded shadow px-4 py-2 text-[12.5px] text-slate-600">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0097A7]"/>
                    Fetching item details from Purchase Order...
                  </div>
                </div>
              )}
              <table className="min-w-full text-[12.5px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8"><input type="checkbox" className="accent-[#0097A7]"/></th>
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">#</th>
                    {['Item Code','Item Name','Supplier Part No','Description','HSN Code','Unit','Stock Qty','Order Qty','Qty','Unit Price','Total','Disc %','Disc Amt','Final Price','Tax %','Net Amt'].map(h=>(
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((row,idx)=>(
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                      <td className="px-2 py-1 text-center"><input type="checkbox" className="accent-[#0097A7]"/></td>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1"><input value={row.itemCode} onChange={e=>setItemField(idx,'itemCode',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.itemName} onChange={e=>setItemField(idx,'itemName',e.target.value)} className={`${inp()} min-w-[120px]`}/></td>
                      <td className="px-1 py-1"><input value={row.supplierPartNo} onChange={e=>setItemField(idx,'supplierPartNo',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.description} onChange={e=>setItemField(idx,'description',e.target.value)} className={`${inp()} min-w-[100px]`}/></td>
                      <td className="px-1 py-1"><input value={row.hsnCode} onChange={e=>setItemField(idx,'hsnCode',e.target.value)} className={inp()}/></td>
                      <td className="px-1 py-1"><input value={row.unit} onChange={e=>setItemField(idx,'unit',e.target.value)} className={`${inp()} w-14`}/></td>
                      <td className="px-1 py-1"><input value={row.stockQty} onChange={e=>setItemField(idx,'stockQty',e.target.value)} className={`${inp()} w-16`}/></td>
                      <td className="px-1 py-1"><input value={row.orderQty} onChange={e=>setItemField(idx,'orderQty',e.target.value)} className={`${inp()} w-16`}/></td>
                      <td className="px-1 py-1"><input value={row.qty} onChange={e=>setItemField(idx,'qty',e.target.value)} className={`${inp()} w-14`}/></td>
                      <td className="px-1 py-1"><input value={row.unitPrice} onChange={e=>setItemField(idx,'unitPrice',e.target.value)} className={`${inp()} w-18`}/></td>
                      <td className="px-1 py-1"><input value={row.total} readOnly className={`${inp()} bg-slate-50 w-18`}/></td>
                      <td className="px-1 py-1"><input value={row.discPer} onChange={e=>setItemField(idx,'discPer',e.target.value)} className={`${inp()} w-14`}/></td>
                      <td className="px-1 py-1"><input value={row.discAmt} readOnly className={`${inp()} bg-slate-50 w-16`}/></td>
                      <td className="px-1 py-1"><input value={row.finalPrice} readOnly className={`${inp()} bg-slate-50 w-18`}/></td>
                      <td className="px-1 py-1"><input value={row.taxPer} onChange={e=>setItemField(idx,'taxPer',e.target.value)} className={`${inp()} w-14`}/></td>
                      <td className="px-1 py-1"><input value={row.netAmt} readOnly className={`${inp()} bg-slate-50 w-18`}/></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100">
                    <td colSpan={17} className="px-3 py-1.5 text-right text-[12px] font-bold text-slate-700 uppercase tracking-wide">Net Total :</td>
                    <td className="px-1 py-1">
                      <input
                        value={items.reduce((s,r)=>s+(parseFloat(r.netAmt)||0),0).toFixed(2)}
                        readOnly
                        className={`${inp()} bg-slate-200 w-18 font-bold text-slate-800`}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Bottom: Remarks + Ledgers + Totals */}
          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[90px] shrink-0 pt-1`}>Remark's :</label>
                <textarea rows={3} value={remarks} onChange={e=>setRemarks(e.target.value)} className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none bg-white"/>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Currency Total :</label>
                <input value={currencyTotal} onChange={e=>setCurrencyTotal(e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Round off :</label>
                <input value={roundOff} onChange={e=>setRoundOff(e.target.value)} className={inp()}/>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>Freight Ledger :</label>
                <select value={freightLedger} onChange={e=>setFreightLedger(e.target.value)} className={inp()}><option>FREIGHT A/C</option></select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[120px] shrink-0`}>TCS Ledger :</label>
                <select value={tcsLedger} onChange={e=>setTcsLedger(e.target.value)} className={inp()}><option>TCS A/C</option></select>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Send className="w-3.5 h-3.5"/>}
                  {submitting ? 'Submitting...' : 'Submit'}
                </button>
                <button className="flex items-center gap-1 px-5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm"><X className="w-3.5 h-3.5"/> Cancel</button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0`}>Sub Total :</label><input value={subTotal.toFixed(2)} readOnly className={`${inp()} bg-slate-50`}/></div>
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0`}>GST Amt :</label><input value={computedGstAmt.toFixed(2)} readOnly className={`${inp()} bg-slate-50`}/></div>
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0`}>IGST Amt :</label><input value={computedIgstAmt.toFixed(2)} readOnly className={`${inp()} bg-slate-50`}/></div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[90px] shrink-0`}>Others :</label>
                <input
                  value={othersAmt}
                  readOnly
                  onClick={() => setShowFreightPopup(true)}
                  placeholder="Click to add freight"
                  className={`${inp()} bg-slate-50 cursor-pointer`}
                />
              </div>
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0`}>OGSTAmt :</label><input value={ogstAmtVal} onChange={e=>setOgstAmtVal(e.target.value)} className={inp()}/></div>
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0`}>TCS % :</label><input value={tcsAmtVal} onChange={e=>setTcsAmtVal(e.target.value)} className={inp()}/></div>
              <div className="flex items-center gap-2"><label className={`${lbl} w-[90px] shrink-0 font-bold text-slate-800`}>Grand Total :</label><input value={grandTotal.toFixed(2)} readOnly className={`${inp()} bg-slate-200 font-bold text-slate-800`}/></div>
            </div>
          </div>
        </div>
      </div>
      {/* PO Search Modal */}
      {showPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-xl w-[720px] max-h-[80vh] flex flex-col">
            <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between rounded-t">
              <h3 className="text-white font-semibold text-[14px]">Select Purchase Order</h3>
              <button onClick={() => setShowPoModal(false)} className="text-white hover:text-white/70"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-3 border-b border-slate-200">
              <input
                autoFocus
                value={poSearch}
                onChange={e => setPoSearch(e.target.value)}
                placeholder="Search by PO No, Supplier, Contact Person..."
                className={`${inp()} w-full`}
              />
            </div>
            <div className="overflow-auto flex-1">
              {poLoading ? (
                <SpinnerLoader message="Loading purchase orders..." />
              ) : filteredPoList.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[13px]">No purchase orders found.</div>
              ) : (
                <table className="min-w-full text-[12.5px]">
                  <thead className="sticky top-0">
                    <tr className="bg-[#4472C4] text-white">
                      {['PO No','PO Date','Supplier Name','Contact Person','Contact No'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPoList.map((p, i) => (
                      <tr
                        key={p.id}
                        onClick={() => selectPo(p)}
                        className={`cursor-pointer border-b border-slate-100 hover:bg-[#0097A7]/10 ${i%2===1?'bg-slate-50/50':''}`}
                      >
                        <td className="px-3 py-1.5 font-medium text-[#0097A7]">{p.poNo}</td>
                        <td className="px-3 py-1.5">{p.poDate ? p.poDate.split('T')[0] : '-'}</td>
                        <td className="px-3 py-1.5">{p.supplier?.supplierName || '-'}</td>
                        <td className="px-3 py-1.5">{p.contactPerson || '-'}</td>
                        <td className="px-3 py-1.5">{p.contactNumber || p.supplier?.mobile || p.supplier?.phone || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-200 text-[11px] text-slate-400 text-right">
              {filteredPoList.length} record{filteredPoList.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* Freight Charges Popup */}
      {showFreightPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-xl w-[820px] max-h-[80vh] flex flex-col">
            <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between rounded-t">
              <h3 className="text-white font-semibold text-[14px]">Freight Charges</h3>
              <button onClick={() => setShowFreightPopup(false)} className="text-white hover:text-white/70"><X className="w-4 h-4"/></button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="min-w-full text-[12.5px]">
                <thead className="sticky top-0">
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">#</th>
                    {['Freight Name','Amount','Tax %','GST Amount','IGST Amount','Net Total','Action'].map(h=>(
                      <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {freightRows.map((row, idx) => (
                    <tr key={idx} className={`border-b border-slate-100 ${idx%2===1?'bg-slate-50/50':''}`}>
                      <td className="px-2 py-1 text-center text-slate-500">{idx+1}</td>
                      <td className="px-1 py-1"><input value={row.freightName} onChange={e=>setFreightRowField(idx,'freightName',e.target.value)} className={`${inp()} min-w-[130px]`}/></td>
                      <td className="px-1 py-1"><input value={row.amount} onChange={e=>setFreightRowField(idx,'amount',e.target.value)} className={`${inp()} w-22`}/></td>
                      <td className="px-1 py-1"><input value={row.taxPer} onChange={e=>setFreightRowField(idx,'taxPer',e.target.value)} className={`${inp()} w-16`}/></td>
                      <td className="px-1 py-1"><input value={row.gstAmt} readOnly className={`${inp()} bg-slate-50 w-22`}/></td>
                      <td className="px-1 py-1"><input value={row.igstAmt} readOnly className={`${inp()} bg-slate-50 w-22`}/></td>
                      <td className="px-1 py-1"><input value={row.netTotal} readOnly className={`${inp()} bg-slate-50 w-22 font-semibold`}/></td>
                      <td className="px-2 py-1 text-center">
                        <button onClick={()=>setFreightRows(r=>r.filter((_,i)=>i!==idx))} className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors">Remove</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-100">
                    <td colSpan={6} className="px-3 py-1.5 text-right text-[12px] font-bold text-slate-700 uppercase tracking-wide">Total :</td>
                    <td className="px-1 py-1"><input value={freightPopupTotal.toFixed(2)} readOnly className={`${inp()} bg-slate-200 w-22 font-bold text-slate-800`}/></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-200 flex items-center justify-between">
              <button onClick={()=>setFreightRows(r=>[...r,emptyFreightRow()])} className="flex items-center gap-1 px-3 py-1.5 bg-[#27ae60] hover:bg-[#229954] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">
                <Plus className="w-3.5 h-3.5"/> Add Row
              </button>
              <div className="flex gap-2">
                <button onClick={applyFreightCharges} className="px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-semibold rounded transition-colors shadow-sm">Apply</button>
                <button onClick={()=>setShowFreightPopup(false)} className="px-4 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[12px] font-semibold rounded transition-colors shadow-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gate Entry Search Modal */}
      {showGateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded shadow-xl w-[780px] max-h-[80vh] flex flex-col">
            <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between rounded-t">
              <h3 className="text-white font-semibold text-[14px]">Select Gate Entry</h3>
              <button onClick={() => setShowGateModal(false)} className="text-white hover:text-white/70"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-3 border-b border-slate-200">
              <input
                autoFocus
                value={gateSearch}
                onChange={e => setGateSearch(e.target.value)}
                placeholder="Search by Gate Entry No, Supplier, PO No, Invoice No..."
                className={`${inp()} w-full`}
              />
            </div>
            <div className="overflow-auto flex-1">
              {gateLoading ? (
                <SpinnerLoader message="Loading gate entries..." />
              ) : filteredGateEntries.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-[13px]">No gate entries found.</div>
              ) : (
                <table className="min-w-full text-[12.5px]">
                  <thead className="sticky top-0">
                    <tr className="bg-[#4472C4] text-white">
                      {['Gate Entry No','Date','Supplier Name','PO No','Invoice No','Status'].map(h => (
                        <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGateEntries.map((e, i) => (
                      <tr
                        key={e.id}
                        onClick={() => selectGateEntry(e)}
                        className={`cursor-pointer border-b border-slate-100 hover:bg-[#0097A7]/10 ${i%2===1?'bg-slate-50/50':''}`}
                      >
                        <td className="px-3 py-1.5 font-medium text-[#0097A7]">{e.gateEntryNo}</td>
                        <td className="px-3 py-1.5">{e.gateEntryDate ? e.gateEntryDate.split('T')[0] : ''}</td>
                        <td className="px-3 py-1.5">{e.supplierName || '-'}</td>
                        <td className="px-3 py-1.5">{e.poNo || '-'}</td>
                        <td className="px-3 py-1.5">{e.invoiceNo || '-'}</td>
                        <td className="px-3 py-1.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${e.status==='Open'?'bg-green-100 text-green-700':'bg-slate-100 text-slate-600'}`}>{e.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="px-4 py-2 border-t border-slate-200 text-[11px] text-slate-400 text-right">
              {filteredGateEntries.length} record{filteredGateEntries.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
