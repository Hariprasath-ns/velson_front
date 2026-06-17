import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { ChevronRight, Plus, Trash2, Send, X, RefreshCw, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import { SpinnerLoader } from '../components/LocalLoader'

/* ─── helpers ─────────────────────────────────────────────────────────────── */
const today = new Date().toISOString().split('T')[0]

const getFinancialYear = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const y1 = month >= 4 ? year : year - 1
  return `${String(y1).slice(-2)}-${String(y1 + 1).slice(-2)}`
}

const PLACEHOLDER_QUOT_NO = `${getFinancialYear()}/Q-----`

const DEFAULT_PAYMENT_TERMS =
  '1. Add GST 18% Applicable Extra\n2. Product: Raw Materials,Machining & Hardening all are at your scope\n3.Inspection: At Your End\n4.If Any dimension MisMatch Or Rejection Found By Quality Control,debit Will Be Raised Against the Invoice and Material sent Back'

const TAX_PERCENT_OPTIONS = [ '18', '28']

const emptyItem = () => ({
  itemId: null, partNo: '', itemName: '', description: '',
  hsnCode: '', uom: '', qty: '', unitPrice: '', amount: '',
})

const emptyForm = () => ({
  customerId: '', customerName: '', customerAddress: '', contactPerson: '',
  contactNumber: '', gstNumber: '', customerRef: '',
  currencyCode: 'INR', exchangeRate: '0',
  modelRef: '', taxType: '', quotationType: '',
  quotationNo: PLACEHOLDER_QUOT_NO, financialYear: getFinancialYear(),
  quotationDate: today, validUntil: '', revisionNo: '0',
  discountType: 'Dis_Per', showTotalsGrid: false,
})

/* ─── style helpers ────────────────────────────────────────────────────────── */
const inp = (err = '') =>
  `w-full border rounded px-2 py-1 text-[12.5px] focus:outline-none focus:ring-1 transition-colors bg-white ${err ? 'border-red-400 focus:ring-red-300' : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'}`
const lbl = 'text-[12px] font-semibold text-slate-600 whitespace-nowrap'

/* ─── component ────────────────────────────────────────────────────────────── */
export default function QuotationEntry() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const pageData = location.state || null
  // 'revision' = Accepted quotation → new revision (POST)
  // 'edit'     = non-Accepted quotation → update in-place (PUT)
  const isRevisionMode = pageData?.mode === 'revision'

  /* master data */
  const [customers, setCustomers]     = useState([])
  const [currencies, setCurrencies]   = useState([])
  const [modelOptions, setModelOptions]   = useState([])
  const [taxTypeOptions, setTaxTypeOptions]         = useState([])
  const [quotationTypeOptions, setQuotationTypeOptions] = useState([])
  const [masterLoading, setMasterLoading]  = useState(true)

  /* form */
  const [form, setForm]     = useState(emptyForm)
  const [items, setItems]   = useState([emptyItem()])
  const [specialDiscount, setSpecialDiscount]       = useState('')
  const [freightAmount, setFreightAmount]           = useState('')
  const [taxPercent, setTaxPercent]                 = useState('18')
  const [packingForwarding, setPackingForwarding]   = useState('')
  const [paymentTerms, setPaymentTerms]             = useState(DEFAULT_PAYMENT_TERMS)
  const [uploadFile, setUploadFile]                 = useState(null)
  const [editModeId, setEditModeId]                 = useState(null)

  /* part autocomplete */
  const [partSuggestions, setPartSuggestions] = useState({})   // { rowIdx: Item[] }
  const [partLoading, setPartLoading]         = useState({})   // { rowIdx: bool }
  const searchTimers  = useRef({})
  const partInputRefs = useRef({})
  const editApplied   = useRef(false)

  /* submit */
  const [submitLoading, setSubmitLoading] = useState(false)

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }))

  /* ── load master data on mount ─────────────────────────────────────────── */
  useEffect(() => {
    const fetchAll = async () => {
      setMasterLoading(true)
      try {
        const [custRes, currRes, modelRes, taxRes, quotTypeRes, nextNoRes] = await Promise.allSettled([
          api.get('/api/customer-master', { skipGlobalLoader: true }),
          api.get('/api/reference-master/Currency', { skipGlobalLoader: true }),
          api.get('/api/reference-master/Vehicle_Type', { skipGlobalLoader: true }),
          api.get('/api/reference-master/Tax%20Type', { skipGlobalLoader: true }),
          api.get('/api/reference-master/Quotation_Type', { skipGlobalLoader: true }),
          api.get('/api/quotation-master/next-no', { skipGlobalLoader: true }),
        ])

        if (custRes.status === 'fulfilled') {
          setCustomers(custRes.value.data?.data || [])
        } else {
          console.error('[QuotationEntry] customer-master fetch error:', custRes.reason)
        }

        if (currRes.status === 'fulfilled') {
          setCurrencies(currRes.value.data?.data || [])
        } else {
          console.error('[QuotationEntry] Currency reference fetch error:', currRes.reason)
        }

        if (modelRes.status === 'fulfilled') {
          setModelOptions(modelRes.value.data?.data || [])
        } else {
          console.error('[QuotationEntry] Vehicle_Type reference fetch error:', modelRes.reason)
        }

        if (taxRes.status === 'fulfilled') {
          setTaxTypeOptions(taxRes.value.data?.data || [])
        } else {
          console.error('[QuotationEntry] Tax_Type reference fetch error:', taxRes.reason)
        }

        if (quotTypeRes.status === 'fulfilled') {
          setQuotationTypeOptions(quotTypeRes.value.data?.data || [])
        } else {
          console.error('[QuotationEntry] Quotation_type reference fetch error:', quotTypeRes.reason)
        }

        if (nextNoRes.status === 'fulfilled') {
          const { quotationNo, financialYear } = nextNoRes.value.data
          setForm(f => ({ ...f, quotationNo, financialYear }))
        } else {
          console.error('[QuotationEntry] next-no fetch error:', nextNoRes.reason)
        }
      } finally {
        setMasterLoading(false)
      }
    }
    fetchAll()
  }, [])

  /* ── pre-fill from revision/edit (triggered from QuotationDetails) ── */
  useEffect(() => {
    const ed = pageData?.editData
    if (!ed || masterLoading || customers.length === 0 || editApplied.current) return
    editApplied.current = true

    const c = customers.find(x => x.id === ed.customerId)
    const addrParts = c ? [c.address, c.address2, c.address3, c.address4, c.city, c.state, c.pinCode].filter(Boolean) : []

    const itemRows = ed.details?.length > 0
      ? ed.details.map(d => ({
          itemId:      d.itemId      ?? null,
          partNo:      d.partNo      ?? '',
          itemName:    d.itemName    ?? '',
          description: d.description ?? '',
          hsnCode:     d.hsnCode     ?? '',
          uom:         d.uom         ?? '',
          qty:         String(d.qty       ?? ''),
          unitPrice:   String(d.unitPrice ?? ''),
          amount:      String(d.amount    ?? ''),
        }))
      : [emptyItem()]

    const commonFields = {
      customerId:       String(ed.customerId ?? ''),
      customerName:     c?.customerName    ?? '',
      customerAddress:  addrParts.join(', '),
      customerRef:      ed.customerRef     ?? '',
      contactPerson:    c?.contactPerson   ?? '',
      contactNumber:    c?.mobile ?? c?.phone ?? '',
      gstNumber:        c?.gstNo           ?? '',
      currencyCode:     ed.currencyCode    ?? 'INR',
      exchangeRate:     String(ed.exchangeRate ?? 1),
      modelRef:         ed.modelRef        ?? '',
      taxType:          ed.taxType         ?? '',
      quotationDate:    ed.quotationDate   ? ed.quotationDate.slice(0, 10) : today,
      validUntil:       ed.validUntil      ? ed.validUntil.slice(0, 10)   : '',
      quotationType:    ed.quotationType   ?? '',
      discountType:     ed.discountType    ?? 'Dis_Per',
      showTotalsGrid:   Boolean(ed.showTotalsGrid),
    }

    // Both Case 1 and Case 2 update the existing quotation (PUT) -> Keep the SAME quotationNo
    setEditModeId(ed.id)

    setForm(f => ({
      ...f,
      ...commonFields,
      quotationNo:   ed.quotationNo   ?? f.quotationNo,
      financialYear: ed.financialYear ?? f.financialYear,
      // Case 2 (Accepted) -> bump revision. Case 1 (Draft) -> keep same revision.
      revisionNo:    isRevisionMode
                       ? String((parseInt(ed.revisionNo) || 0) + 1)
                       : String(ed.revisionNo ?? 0),
    }))

    setItems(itemRows)
    setSpecialDiscount(String(ed.specialDiscount   ?? ''))
    setFreightAmount(String(ed.freightAmount        ?? ''))
    setTaxPercent(String(ed.taxPercent              ?? '18'))
    setPackingForwarding(String(ed.packingForwarding ?? ''))
    setPaymentTerms(ed.paymentTerms || DEFAULT_PAYMENT_TERMS)
  }, [pageData, masterLoading, customers])

  /* ── customer select → auto-fill ───────────────────────────────────────── */
  const handleCustomerChange = useCallback((id) => {
    if (!id) {
      setForm(f => ({
        ...f,
        customerId: '', customerName: '', customerAddress: '',
        contactPerson: '', contactNumber: '', gstNumber: '', customerRef: '',
      }))
      return
    }
    const c = customers.find(x => String(x.id) === String(id))
    if (!c) return
    const addrParts = [c.address, c.address2, c.address3, c.address4, c.city, c.state, c.pinCode]
      .filter(Boolean)
    setForm(f => ({
      ...f,
      customerId:      String(c.id),
      customerName:    c.customerName || '',
      customerAddress: addrParts.join(', '),
      customerRef:     c.cCode || '',
      contactPerson:   c.contactPerson || '',
      contactNumber:   c.mobile || c.phone || '',
      gstNumber:       c.gstNo || '',
    }))
  }, [customers])

  /* ── item row helpers ──────────────────────────────────────────────────── */
  const setItemField = (idx, k, v) => {
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      const updated = { ...r, [k]: v }
      if (k === 'qty' || k === 'unitPrice') {
        const q = parseFloat(k === 'qty' ? v : updated.qty) || 0
        const p = parseFloat(k === 'unitPrice' ? v : updated.unitPrice) || 0
        updated.amount = (q * p).toFixed(2)
      }
      return updated
    }))
  }

  const addRow    = () => setItems(r => [...r, emptyItem()])
  const removeRow = (idx) => setItems(r => r.filter((_, i) => i !== idx))

  /* ── part no autocomplete ──────────────────────────────────────────────── */
  const handlePartSearch = (idx, value) => {
    setItemField(idx, 'partNo', value)

    if (searchTimers.current[idx]) clearTimeout(searchTimers.current[idx])

    if (!value || value.length < 1) {
      setPartSuggestions(prev => ({ ...prev, [idx]: [] }))
      return
    }

    setPartLoading(prev => ({ ...prev, [idx]: true }))
    searchTimers.current[idx] = setTimeout(async () => {
      try {
        const res = await api.get('/api/item-master', {
          params: { search: value, limit: 20, page: 1 },
          skipGlobalLoader: true,
        })
        const suggestions = res.data?.data || []
        setPartSuggestions(prev => ({ ...prev, [idx]: suggestions }))
        console.log(`[QuotationEntry] part search "${value}" → ${suggestions.length} result(s)`)
      } catch (err) {
        console.error(`[QuotationEntry] part search error (row ${idx}):`, err)
        setPartSuggestions(prev => ({ ...prev, [idx]: [] }))
      } finally {
        setPartLoading(prev => ({ ...prev, [idx]: false }))
      }
    }, 300)
  }

  const selectPartItem = (idx, item) => {
    const unitPrice = item.rate ?? 0
    setItems(rows => rows.map((r, i) => {
      if (i !== idx) return r
      const qty = parseFloat(r.qty) || 0
      return {
        ...r,
        itemId:      item.id,
        partNo:      item.partNo      || '',
        itemName:    item.partName    || '',
        description: item.description || '',
        hsnCode:     item.hsnCode     || '',
        uom:         item.uom,                         // no unit name from API; keep existing
        unitPrice:   String(unitPrice),
        amount:      (qty * unitPrice).toFixed(2),
      }
    }))
    setPartSuggestions(prev => ({ ...prev, [idx]: [] }))
  }

  const clearPartSuggestions = (idx) => {
    setTimeout(() => setPartSuggestions(prev => ({ ...prev, [idx]: [] })), 200)
  }

  /* ── totals ─────────────────────────────────────────────────────────────── */
  const subTotal  = items.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0)
  const specDisc  = parseFloat(specialDiscount) || 0
  const freight   = parseFloat(freightAmount)   || 0
  const pack      = parseFloat(packingForwarding) || 0
  const afterDisc = subTotal - specDisc
  const taxAmt    = afterDisc * (parseFloat(taxPercent) || 0) / 100
  const totalAmt  = afterDisc + taxAmt + freight + pack

  /* ── submit ─────────────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!form.customerId) {
      toast.error('Please select a customer')
      return
    }
    if (!form.quotationNo || form.quotationNo.includes('-')) {
      // allow submit even with placeholder; backend validates
    }

    setSubmitLoading(true)
    try {
      const payload = {
        quotationNo:      form.quotationNo,
        financialYear:    form.financialYear,
        customerId:       form.customerId,
        customerRef:      form.customerRef,
        currencyCode:     form.currencyCode,
        exchangeRate:     form.exchangeRate,
        modelRef:         form.modelRef,
        taxType:          form.taxType,
        quotationDate:    form.quotationDate,
        validUntil:       form.validUntil || null,
        revisionNo:       form.revisionNo,
        quotationType:    form.quotationType,
        discountType:     form.discountType,
        showTotalsGrid:   form.showTotalsGrid,
        specialDiscount,
        freightAmount,
        taxPercent,
        packingForwarding,
        subTotal:         subTotal.toFixed(2),
        taxAmount:        taxAmt.toFixed(2),
        totalAmount:      totalAmt.toFixed(2),
        paymentTerms,
        status:           'Draft',
        createdBy:        'ADMIN',
        items:            items.filter(r => r.partNo || r.itemName),
      }

      let newId = null
      if (editModeId) {
        const res = await api.put(`/api/quotation-master/${editModeId}`, payload, { loadingMessage: 'Updating quotation...' })
        newId = res.data?.data?.id || editModeId
      } else {
        const res = await api.post('/api/quotation-master', payload, { loadingMessage: 'Saving quotation...' })
        newId = res.data?.data?.id
      }
      
      if (uploadFile && newId) {
        const formData = new FormData()
        formData.append('document', uploadFile)
        await api.post(`/api/quotation-master/${newId}/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          loadingMessage: 'Uploading document...'
        })
      }

      toast.success(editModeId ? 'Quotation updated successfully!' : 'Quotation saved successfully!')

      /* fetch next quotation number for a fresh entry */
      try {
        const res = await api.get('/api/quotation-master/next-no', { skipGlobalLoader: true })
        const { quotationNo, financialYear } = res.data
        setForm({ ...emptyForm(), quotationNo, financialYear })
      } catch (err) {
        console.error('[QuotationEntry] next-no refresh error:', err)
        setForm(emptyForm())
      }
      setItems([emptyItem()])
      setSpecialDiscount('')
      setFreightAmount('')
      setPackingForwarding('')
      setPaymentTerms(DEFAULT_PAYMENT_TERMS)
      setEditModeId(null)
    } catch (err) {
      const msg = err.response?.data?.message || err.message
      console.error('[QuotationEntry] submit error:', err)
      toast.error(`Save failed: ${msg}`)
    } finally {
      setSubmitLoading(false)
    }
  }

  /* ── cancel / reset ────────────────────────────────────────────────────── */
  const handleCancel = async () => {
    try {
      const res = await api.get('/api/quotation-master/next-no', { skipGlobalLoader: true })
      const { quotationNo, financialYear } = res.data
      setForm({ ...emptyForm(), quotationNo, financialYear })
    } catch (err) {
      console.error('[QuotationEntry] next-no refresh error:', err)
      setForm(emptyForm())
    }
    setItems([emptyItem()])
    setSpecialDiscount('')
    setFreightAmount('')
    setPackingForwarding('')
    setPaymentTerms(DEFAULT_PAYMENT_TERMS)
    setUploadFile(null)
    setPartSuggestions({})
    setEditModeId(null)
  }

  /* ── render ─────────────────────────────────────────────────────────────── */
  return (
    <div className="p-4 space-y-4 w-full min-w-0 overflow-x-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span
          onClick={() => navigate('/quotation/quotation-details')}
          className="hover:text-[#0097A7] cursor-pointer"
        >Quotation Details</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">
          {isRevisionMode ? 'New Revision' : editModeId ? 'Edit Quotation' : 'Quotation Entry'}
        </span>
      </div>

      {/* Main form card */}
      <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden relative">

        {/* Master-data loading overlay */}
        {masterLoading && (
          <div className="absolute inset-0 z-20 bg-white/75 flex items-center justify-center rounded">
            <SpinnerLoader size={20} message="Loading form data…" />
          </div>
        )}

        {/* Header bar */}
        <div className="bg-[--color-main] px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-semibold text-[14px]">
              {isRevisionMode ? 'New Revision' : editModeId ? 'Edit Quotation' : 'Quotation Entry'}
            </h2>
            {isRevisionMode && (
              <span className="px-2 py-0.5 bg-blue-400 text-blue-900 text-[10px] font-bold rounded-full uppercase tracking-wide">
                Revision #{form.revisionNo} — {form.quotationNo}
              </span>
            )}
            {editModeId && !isRevisionMode && (
              <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-[10px] font-bold rounded-full uppercase tracking-wide">
                Editing #{form.quotationNo}
              </span>
            )}
          </div>
          <button onClick={handleCancel} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white text-[12px] rounded transition-colors">
            {editModeId || isRevisionMode ? 'Cancel' : 'Close'}
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* ── 3-column header grid ── */}
          <div className="grid grid-cols-3 gap-4">

            {/* Column 1 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Customer Name:</label>
                <select
                  value={form.customerId}
                  onChange={e => handleCustomerChange(e.target.value)}
                  className={inp()}
                  disabled={masterLoading}
                >
                  <option value="">Select Customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-start gap-2">
                <label className={`${lbl} w-[130px] shrink-0 pt-1`}>Customer Address:</label>
                <textarea
                  rows={3}
                  value={form.customerAddress}
                  onChange={e => setField('customerAddress', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Customer Ref. No:</label>
                <input
                  value={form.customerRef}
                  onChange={e => setField('customerRef', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Currency:</label>
                <select
                  value={form.currencyCode}
                  onChange={e => setField('currencyCode', e.target.value)}
                  className={inp()}
                  disabled={masterLoading}
                >
                  {currencies.length > 0
                    ? currencies.map(c => (
                        <option key={c.id} value={c.description}>{c.description}</option>
                      ))
                    : ['INR', 'USD', 'EUR', 'GBP'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))
                  }
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Show Totals Grid:</label>
                <input
                  type="checkbox"
                  checked={form.showTotalsGrid}
                  onChange={e => setField('showTotalsGrid', e.target.checked)}
                  className="w-4 h-4 accent-[#0097A7]"
                />
                <span className="text-[12px] text-slate-500">Show Totals Grid</span>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact Person:</label>
                <input
                  value={form.contactPerson}
                  onChange={e => setField('contactPerson', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Contact Number:</label>
                <input
                  value={form.contactNumber}
                  onChange={e => setField('contactNumber', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>GST Number:</label>
                <input
                  value={form.gstNumber}
                  onChange={e => setField('gstNumber', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Validity Until:</label>
                <input
                  type="date"
                  value={form.validUntil}
                  onChange={e => setField('validUntil', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Model:</label>
                <select
                  value={form.modelRef}
                  onChange={e => setField('modelRef', e.target.value)}
                  className={inp()}
                  disabled={masterLoading}
                >
                  <option value="">Select Model</option>
                  {modelOptions.length > 0
                    ? modelOptions.map(m => (
                        <option key={m.id} value={m.description}>{m.description}</option>
                      ))
                    : ['V10', 'V20', 'V30', 'Consumables', 'VELSON TYPE', 'HM Series'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))
                  }
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Ex.Rate:</label>
                <input
                  value={form.exchangeRate}
                  onChange={e => setField('exchangeRate', e.target.value)}
                  className={inp()}
                />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Quotation Number:</label>
                <input
                  value={form.quotationNo}
                  readOnly
                  className={`${inp()} bg-slate-50`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Quotation Date:</label>
                <input
                  type="date"
                  value={form.quotationDate}
                  onChange={e => setField('quotationDate', e.target.value)}
                  className={inp()}
                />
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Revision Number:</label>
                <input
                  value={form.revisionNo}
                  readOnly
                  className="border border-slate-300 rounded px-2 py-1 text-[12.5px] bg-slate-50 text-center w-16 focus:outline-none"
                />
                <button
                  onClick={() => setField('revisionNo', String(parseInt(form.revisionNo || '0') + 1))}
                  className="flex items-center gap-1 px-3 py-1 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-semibold rounded shadow-sm transition-colors whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" /> Revision
                </button>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Quotation Type:</label>
                <select
                  value={form.quotationType}
                  onChange={e => setField('quotationType', e.target.value)}
                  className={inp()}
                  disabled={masterLoading}
                >
                  <option value="">Select Type</option>
                  {quotationTypeOptions.length > 0
                    ? quotationTypeOptions.map(t => (
                        <option key={t.id} value={t.description}>{t.description}</option>
                      ))
                    : ['Supply', 'Service', 'Supply & Service'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))
                  }
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Tax Type:</label>
                <select
                  value={form.taxType}
                  onChange={e => {
                    const val = e.target.value
                    setField('taxType', val)
                    const u = val.toUpperCase()
                    if (u.includes('LOCAL'))      setTaxPercent('18')
                    else if (u.includes('INTER')) setTaxPercent('28')
                  }}
                  className={inp()}
                  disabled={masterLoading}
                >
                  <option value="">Select Tax Type</option>
                  {taxTypeOptions.length > 0
                    ? taxTypeOptions.map(t => (
                        <option key={t.id} value={t.description}>{t.description}</option>
                      ))
                    : ['GST', 'IGST', 'No Tax'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))
                  }
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className={`${lbl} w-[130px] shrink-0`}>Discount Type:</label>
                <div className="flex items-center gap-3">
                  {['Dis_Per', 'Dis_Amt'].map(v => (
                    <label key={v} className="flex items-center gap-1 text-[12.5px] cursor-pointer">
                      <input
                        type="radio" name="discountType" value={v}
                        checked={form.discountType === v}
                        onChange={() => setField('discountType', v)}
                        className="accent-[#0097A7]"
                      />
                      {v}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="flex flex-wrap items-center justify-end gap-3 px-4 pb-4">
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[12.5px] font-medium rounded shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button
            onClick={() => { if (items.length > 1) setItems(r => r.slice(0, -1)) }}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[12.5px] font-medium rounded shadow-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete Row
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-[12.5px] font-medium rounded shadow-sm transition-colors"
          >
            <X className="w-4 h-4" /> Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitLoading}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#0097A7] hover:bg-[#007a87] disabled:opacity-60 text-white text-[12.5px] font-medium rounded shadow-sm transition-colors"
          >
            {submitLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> {editModeId ? 'Updating…' : 'Saving…'}</>
              : <><Send className="w-4 h-4" /> {editModeId ? 'Update' : isRevisionMode ? 'Save Revision' : 'Submit'}</>
            }
          </button>
        </div>

        {/* ── Items grid ── */}
        <div className="p-2">
          <div className="bg-slate-700 px-3 py-1.5 rounded-t">
            <h3 className="text-white text-[13px] font-semibold">Items</h3>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-b">
            <table className="min-w-full text-[12.5px]" style={{ overflow: 'visible' }}>
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">
                    <input type="checkbox" className="accent-[#0097A7]" />
                  </th>
                  <th className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase w-8">#</th>
                  {['Part No', 'Item Name', 'Description', 'HSN Code', 'UOM', 'Qty', 'Unit Price', 'Amount', 'Action'].map(h => (
                    <th key={h} className="px-2 py-1.5 text-center font-bold text-slate-600 text-[11px] uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((row, idx) => (
                  <tr key={idx} className={`border-b border-slate-100 ${idx % 2 === 1 ? 'bg-slate-50/50' : ''}`}
                    style={{ overflow: 'visible' }}>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" className="accent-[#0097A7]" />
                    </td>
                    <td className="px-2 py-1 text-center text-slate-500">{idx + 1}</td>

                    {/* ── Part No with autocomplete ── */}
                    <td className="px-1 py-1" style={{ minWidth: 140 }}>
                      <div className="relative">
                        <input
                          ref={el => { partInputRefs.current[idx] = el }}
                          value={row.partNo}
                          onChange={e => handlePartSearch(idx, e.target.value)}
                          onBlur={() => clearPartSuggestions(idx)}
                          placeholder="Type to search…"
                          className={inp()}
                        />
                        {partLoading[idx] && (
                          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 animate-spin text-slate-400" />
                        )}
                        {partSuggestions[idx]?.length > 0 && partInputRefs.current[idx] &&
                          createPortal(
                            <div
                              style={{
                                position: 'fixed',
                                top:  partInputRefs.current[idx].getBoundingClientRect().bottom,
                                left: partInputRefs.current[idx].getBoundingClientRect().left,
                                width: 256,
                                zIndex: 9999,
                              }}
                              className="bg-white border border-slate-200 rounded shadow-lg max-h-44 overflow-y-auto"
                            >
                              {partSuggestions[idx].map(item => (
                                <div
                                  key={item.id}
                                  onMouseDown={() => selectPartItem(idx, item)}
                                  className="px-2 py-1.5 text-[12px] hover:bg-[#0097A7] hover:text-white cursor-pointer border-b border-slate-100 last:border-0"
                                >
                                  <span className="font-semibold">{item.partNo}</span>
                                  {item.partName && (
                                    <span className="ml-1">— {item.partName}</span>
                                  )}
                                </div>
                              ))}
                            </div>,
                            document.body
                          )
                        }
                      </div>
                    </td>

                    <td className="px-1 py-1">
                      <input value={row.itemName} onChange={e => setItemField(idx, 'itemName', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.description} onChange={e => setItemField(idx, 'description', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.hsnCode} onChange={e => setItemField(idx, 'hsnCode', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.uom} onChange={e => setItemField(idx, 'uom', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.qty} onChange={e => setItemField(idx, 'qty', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.unitPrice} onChange={e => setItemField(idx, 'unitPrice', e.target.value)} className={inp()} />
                    </td>
                    <td className="px-1 py-1">
                      <input value={row.amount} readOnly className={`${inp()} bg-slate-50`} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <button
                        onClick={() => removeRow(idx)}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[11px] rounded transition-colors"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Bottom section ── */}
        <div className="grid grid-cols-2 gap-6 p-4">
          {/* Left: upload + payment terms */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className={`${lbl} w-36 shrink-0`}>Upload Document:</label>
              <div className="flex-1 flex gap-2 items-center">
                <input
                  type="file"
                  onChange={e => setUploadFile(e.target.files[0])}
                  className="text-[12px] text-slate-600 border border-slate-300 rounded px-2 py-1 w-full"
                />
                {uploadFile ? (
                  <button
                    type="button"
                    onClick={() => window.open(URL.createObjectURL(uploadFile), '_blank')}
                    className="px-3 py-1 bg-[#0097A7] text-white text-[11px] rounded hover:bg-[#007a87] transition-colors whitespace-nowrap shadow-sm"
                  >
                    Preview
                  </button>
                ) : (
                  pageData?.editData?.documentMimeType && (
                    <button
                      type="button"
                      onClick={() => window.open(`${api.defaults.baseURL || ''}/api/quotation-master/${pageData.editData.id}/download-document`, '_blank')}
                      className="px-3 py-1 bg-[#0097A7] text-white text-[11px] rounded hover:bg-[#007a87] transition-colors whitespace-nowrap shadow-sm"
                    >
                      View Attached
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="flex items-start gap-2">
              <label className={`${lbl} w-36 shrink-0 pt-1`}>Payment Terms:</label>
              <textarea
                rows={5}
                value={paymentTerms}
                onChange={e => setPaymentTerms(e.target.value)}
                className="flex-1 border border-slate-300 rounded px-2 py-1 text-[12px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] resize-none"
              />
            </div>
          </div>

          {/* Right: totals */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className={`${lbl} w-36 shrink-0`}>Special Discount:</label>
              <input value={specialDiscount} onChange={e => setSpecialDiscount(e.target.value)} className={`${inp()} !w-[150px] flex-none`} />
              <span className="text-[12px] text-slate-500 ml-auto">Sub Total:</span>
              <span className="text-[13px] font-semibold text-slate-700 w-24 text-right">{subTotal.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className={`${lbl} w-36 shrink-0`}>Freight Amount:</label>
              <input value={freightAmount} onChange={e => setFreightAmount(e.target.value)} className={`${inp()} !w-[150px] flex-none`} />
              <span className="text-[12px] text-slate-500 ml-auto">After Discount:</span>
              <span className="text-[13px] font-semibold text-slate-700 w-24 text-right">{afterDisc.toFixed(2)}</span>
            </div>
            <div className="flex items-center gap-2">
              <label className={`${lbl} w-36 shrink-0`}>Tax (%):</label>
              <select value={taxPercent} onChange={e => setTaxPercent(e.target.value)} className={`${inp()} !w-[150px] flex-none`}>
                {TAX_PERCENT_OPTIONS.map(t => <option key={t}>{t}</option>)}
              </select>
              <span className="text-[12px] text-slate-500 ml-auto">Packing &amp; Forwarding:</span>
              <input value={packingForwarding} onChange={e => setPackingForwarding(e.target.value)} className={`${inp()} !w-[100px] flex-none`} />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <span className="text-[12px] text-slate-500">Total Amount:</span>
              <span className="text-[14px] font-bold text-[#0097A7] w-24 text-right">{totalAmt.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── GST Summary ── */}
        {(() => {
          const isInter = form.taxType?.toUpperCase().includes('INTER')
          const gst  = isInter ? 0 : taxAmt
          const igst  = isInter ? taxAmt : 0
          const rows = [
            ['GST Amount', gst.toFixed(2)],
            ['IGST Amount', igst.toFixed(2)],
            ['G.T. Before RoundOff', totalAmt.toFixed(2)],
            ['Grand Total', Math.round(totalAmt)],
          ]
          return (
            <div className="grid grid-cols-5 gap-3 border-t border-slate-200 p-3 mt-2">
              {rows.map(([label, val]) => (
                <div key={label} className="flex flex-col">
                  <span className="text-[11px] font-semibold text-slate-500">{label}</span>
                  <span className="text-[13px] font-bold text-slate-800">{val}</span>
                </div>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}
