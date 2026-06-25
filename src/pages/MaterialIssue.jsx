import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ChevronRight, X, Search, Save, Trash2, Loader2, FileSpreadsheet, RotateCcw, Camera
} from 'lucide-react'
import { useToast } from '../components/Toast'
import { useLoading } from '../context/LoadingContext'
import api from '../services/api'

// Helper Styling primitives
const inp = (readOnly = false, className = '') =>
  `w-full px-2.5 py-1 text-[13px] h-[32px] border border-slate-350 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold font-mono' : 'hover:border-slate-405'
  } ${className}`

const lbl = 'text-[11.5px] font-bold text-slate-500 whitespace-nowrap uppercase tracking-wide'

const Combobox = ({ options, placeholder, value, onChange, readOnly = false, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState(value || '')
  const containerRef = useRef(null)

  useEffect(() => {
    setSearch(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = useMemo(() => {
    if (!search || search === value) return options
    const s = search.toLowerCase()
    return options.filter(o => o && o.toLowerCase().includes(s))
  }, [options, search, value])

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={search}
        readOnly={readOnly}
        onChange={e => {
          setSearch(e.target.value)
          onChange(e.target.value)
          setIsOpen(true)
        }}
        onFocus={() => {
          if (!readOnly) setIsOpen(true)
        }}
        className={inp(readOnly)}
      />
      {!readOnly && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute inset-y-0 right-0 px-2.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
      {isOpen && !readOnly && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-40 overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-slate-400 text-[12.5px] italic">No results found</div>
          ) : (
            filteredOptions.map(o => (
              <div
                key={o}
                onClick={() => {
                  onChange(o)
                  setSearch(o)
                  setIsOpen(false)
                }}
                className="px-3 py-1.5 text-[13px] text-slate-700 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer transition-colors"
              >
                {o}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function MaterialIssue() {
  const toast = useToast()
  const { show: showLoader, hide: hideLoader } = useLoading()

  // References Data
  const [departments, setDepartments] = useState([])
  const [models, setModels] = useState([])
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [itemMasterList, setItemMasterList] = useState([])
  const [jobsList, setJobsList] = useState([])

  // States
  const [submitting, setSubmitting] = useState(false)
  const [issueNo, setIssueNo] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [department, setDepartment] = useState('Production')
  const [remarks, setRemarks] = useState('')
  const [model, setModel] = useState('')
  const [inchargeName, setInchargeName] = useState('')
  const [receiverName, setReceiverName] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerCode, setCustomerCode] = useState('')
  const [validate, setValidate] = useState(false)

  // Transaction fields state (Row Input)
  const [serviceJobNo, setServiceJobNo] = useState('')
  const [servicePartNo, setServicePartNo] = useState('')
  const [partNo, setPartNo] = useState('')
  const [partName, setPartName] = useState('')
  const [brand, setBrand] = useState('')
  const [qty, setQty] = useState('')
  const [uom, setUom] = useState('')
  const [description, setDescription] = useState('')
  const [spec, setSpec] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')

  // Barcode & Stock states
  const [barcodeList, setBarcodeList] = useState([])
  const [selectedBarcodeObj, setSelectedBarcodeObj] = useState(null)
  const [barcodeSearch, setBarcodeSearch] = useState('')
  const [availableStock, setAvailableStock] = useState(0.0)

  // Main table list
  const [issuedItems, setIssuedItems] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedGridRows, setSelectedGridRows] = useState([]) // indices of rows selected in the main grid

  // BOM items list
  const [rawBomItems, setRawBomItems] = useState([])
  const bomItems = useMemo(() => {
    return rawBomItems.filter(it => {
      const localIssued = issuedItems.filter(li => li.partNo === it.partNo).reduce((sum, li) => sum + li.qty, 0)
      return it.balanceQty - localIssued > 0
    })
  }, [rawBomItems, issuedItems])
  const [selectedBomItem, setSelectedBomItem] = useState(null)
  const [showBOM, setShowBOM] = useState(true)

  // Load Initial Master Data
  const loadInitialData = async () => {
    showLoader('Loading initial master data...')
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      setIssueDate(todayStr)

      const [deptsRes, vTypesRes, empsRes, custsRes, itemsRes, bookingsRes, nextNoRes] = await Promise.all([
        api.get('/api/reference-master/Department', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/reference-master/Vehicle_Type', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/employee-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/customer-master', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/item-master?limit=10000', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/service-booking', { skipGlobalLoader: true }).then(r => r.data?.data || []).catch(() => []),
        api.get('/api/material-issue/next-number', { skipGlobalLoader: true }).then(r => r.data?.data || {}).catch(() => ({}))
      ])

      setDepartments(deptsRes.map(d => d.description).filter(Boolean))
      setModels(vTypesRes.map(v => v.description).filter(Boolean))
      setEmployees(empsRes)
      setCustomers(custsRes)
      setItemMasterList(itemsRes)
      setJobsList(bookingsRes)

      setIssueNo(nextNoRes.issueNo || '')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load initial master data')
    } finally {
      hideLoader()
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  // Options derived
  const serviceJobNoOptions = useMemo(() => {
    return [...new Set(jobsList.map(j => j.serviceJobNo).filter(Boolean))]
  }, [jobsList])

  const [serviceSpares, setServiceSpares] = useState([])
  const servicePartNoOptions = useMemo(() => {
    return [...new Set(serviceSpares.map(s => s.servicePartNo || '(Unassigned)'))]
  }, [serviceSpares])

  // Select Job No
  const handleJobNoChange = async (val) => {
    setServiceJobNo(val)
    setServicePartNo('')
    setRawBomItems([])
    setSelectedBomItem(null)
    clearTransactionFields()

    if (!val) {
      setCustomerName('')
      setCustomerCode('')
      setModel('')
      setServiceSpares([])
      return
    }

    const job = jobsList.find(j => j.serviceJobNo && j.serviceJobNo.toLowerCase() === val.toLowerCase())
    if (job) {
      setCustomerName(job.customerName || '')
      setCustomerCode(job.customerCode || '')
      setModel(job.vehicleModelNo || '')
    }

    try {
      const sparesRes = await api.get('/api/service-spare', { loadingMessage: 'Loading job spares...' })
      const allSpares = sparesRes.data?.data || []
      const filteredSpares = allSpares.filter(s => s.serviceJobNo && s.serviceJobNo.toLowerCase() === val.toLowerCase())
      setServiceSpares(filteredSpares)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load spares for job')
    }
  }

  // Select Service Part No
  const handleServicePartNoChange = async (val) => {
    setServicePartNo(val)
    setSelectedBomItem(null)
    clearTransactionFields()

    if (!val) {
      setRawBomItems([])
      return
    }

    try {
      const bomRes = await api.get(`/api/material-issue/bom-items?servicePartNo=${encodeURIComponent(val)}&serviceJobNo=${encodeURIComponent(serviceJobNo)}`, { loadingMessage: 'Loading BOM items...' })
      const items = bomRes.data?.data || []
      setRawBomItems(items)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load BOM items')
    }
  }

  // Select BOM Item
  const handleSelectBomItem = async (item) => {
    setSelectedBomItem(item)
    setPartNo(item.partNo)
    setPartName(item.partName)
    setUom(item.uom)

    const matchedItem = itemMasterList.find(im => im.partNo === item.partNo)
    if (matchedItem) {
      setBrand(matchedItem.brand || '')
      setDescription(matchedItem.description || '')
      setSpec(matchedItem.size || matchedItem.routeCardNo || '')
      setRate(matchedItem.purchaseRate || matchedItem.rate || 0)
    } else {
      setBrand('')
      setDescription('')
      setSpec('')
      setRate(0)
    }

    setQty('')
    setAmount('')
    setBarcodeSearch('')
    setSelectedBarcodeObj(null)
    setAvailableStock(0.0)

    try {
      const bcRes = await api.get(`/api/material-issue/barcodes?partNo=${encodeURIComponent(item.partNo)}`, { loadingMessage: 'Loading stock details...' })
      const list = bcRes.data?.data || []
      const updatedList = list.map(bc => {
        const localDeducted = issuedItems
          .filter(li => li.partNo === item.partNo && li.barcode === bc.barcode)
          .reduce((sum, li) => sum + li.qty, 0)
        return {
          ...bc,
          stockQty: Math.max(0, bc.stockQty - localDeducted)
        }
      })
      setBarcodeList(updatedList)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load stock details')
    }
  }

  // Barcode selection
  const handleBarcodeChange = (val) => {
    setBarcodeSearch(val)
    const matched = barcodeList.find(b => b.barcode === val)
    if (matched) {
      setSelectedBarcodeObj(matched)
      setAvailableStock(matched.stockQty)
      const actualRate = matched.rate || rate || 0
      setRate(actualRate)
      if (qty) {
        setAmount((parseFloat(qty) * actualRate).toFixed(2))
      }
    } else {
      setSelectedBarcodeObj(null)
      setAvailableStock(0.0)
    }
  }

  // Issue Qty Change
  const handleQtyChange = (val) => {
    setQty(val)
    const num = parseFloat(val)
    if (!isNaN(num) && rate) {
      setAmount((num * parseFloat(rate)).toFixed(2))
    } else {
      setAmount('')
    }
  }

  const clearTransactionFields = () => {
    setPartNo('')
    setPartName('')
    setBrand('')
    setQty('')
    setUom('')
    setDescription('')
    setSpec('')
    setRate('')
    setAmount('')
    setBarcodeList([])
    setSelectedBarcodeObj(null)
    setBarcodeSearch('')
    setAvailableStock(0.0)
  }

  // Add Item to Grid
  const handleSaveItem = () => {
    if (!selectedBomItem) {
      toast.warning('Please select a BOM Item first')
      return
    }
    if (!selectedBarcodeObj) {
      toast.warning('Please select a valid barcode')
      return
    }

    const numQty = parseFloat(qty)
    if (isNaN(numQty) || numQty <= 0) {
      toast.error('Issue Quantity must be greater than 0')
      return
    }

    if (numQty > availableStock) {
      toast.error(`Issue Quantity cannot exceed Available Stock (${availableStock})`)
      return
    }

    const localIssued = issuedItems.filter(li => li.partNo === partNo).reduce((sum, li) => sum + li.qty, 0)
    const remainingBal = selectedBomItem.balanceQty - localIssued

    if (numQty > remainingBal) {
      toast.error(`Issue Quantity cannot exceed remaining BOM Balance Quantity (${remainingBal})`)
      return
    }

    const newItem = {
      id: Date.now(),
      customerCode: customerCode,
      barcode: selectedBarcodeObj.barcode,
      partNo: partNo,
      partName: partName,
      spec: spec,
      qty: numQty,
      uom: uom,
      price: parseFloat(rate),
      amount: parseFloat(amount),
      source: selectedBarcodeObj.source,
      sourceId: selectedBarcodeObj.id
    }

    setIssuedItems(prev => [...prev, newItem])
    toast.success('Item added to issue list')

    clearTransactionFields()
    setSelectedBomItem(null)
  }

  // Delete selected items from grid
  const handleDeleteSelected = () => {
    if (selectedGridRows.length === 0) {
      toast.warning('No items selected for deletion')
      return
    }
    setIssuedItems(prev => prev.filter((_, idx) => !selectedGridRows.includes(idx)))
    setSelectedGridRows([])
    toast.success('Selected items removed')
  }

  // Clear Form
  const handleClearAll = () => {
    setServiceJobNo('')
    setServicePartNo('')
    setRawBomItems([])
    setSelectedBomItem(null)
    clearTransactionFields()
    setIssuedItems([])
    setSelectedGridRows([])
    setRemarks('')
    setInchargeName('')
    setReceiverName('')
    setCustomerName('')
    setCustomerCode('')
    setModel('')
    loadInitialData()
  }

  // Submit to DB
  const handleSubmitIssue = async () => {
    if (!remarks) {
      toast.error('Remarks field is required')
      return
    }
    if (!model) {
      toast.error('Model field is required')
      return
    }
    if (issuedItems.length === 0) {
      toast.warning('No items added to the issue list')
      return
    }

    setSubmitting(true)
    const payload = {
      header: {
        issueNo,
        issueDate: new Date(issueDate).toISOString(),
        department,
        remarks,
        model,
        inchargeName,
        receiverName,
        customerName,
        customerCode,
        serviceJobNo,
        servicePartNo
      },
      details: issuedItems.map(it => ({
        partNo: it.partNo,
        partName: it.partName,
        barcode: it.barcode,
        currentIssuedQty: it.qty,
        source: it.source,
        sourceId: it.sourceId,
        user: 'Admin'
      }))
    }

    try {
      await api.post('/api/material-issue', payload, { loadingMessage: 'Saving material issue entry...' })
      toast.success(`Material Issue ${issueNo} submitted successfully!`)
      handleClearAll()
    } catch (err) {
      console.error(err)
      toast.error('Transaction Failed. ' + (err.response?.data?.message || err.message))
    } finally {
      setSubmitting(false)
    }
  }

  // Image lookup
  const partImageSrc = useMemo(() => {
    let pNo = partNo
    if (!pNo && servicePartNo) {
      pNo = servicePartNo.split(' - ')[0].trim()
    }
    if (!pNo) return null

    const matched = itemMasterList.find(im => im.partNo === pNo)
    if (matched) {
      if (matched.hasImage) {
        return `/api/item-master/${matched.id}/download-image`
      }
      if (matched.imagePath) {
        if (matched.imagePath.startsWith('http') || matched.imagePath.startsWith('/')) {
          return matched.imagePath
        }
        return `/uploads/${matched.imagePath}`
      }
    }
    return null
  }, [partNo, servicePartNo, itemMasterList])

  // Summary stats
  const totalQty = useMemo(() => issuedItems.reduce((sum, it) => sum + it.qty, 0), [issuedItems])
  const totalPrice = useMemo(() => issuedItems.reduce((sum, it) => sum + it.amount, 0), [issuedItems])

  const filteredIssuedItems = useMemo(() => {
    if (!searchText.trim()) return issuedItems
    const q = searchText.toLowerCase()
    return issuedItems.filter(it =>
      (it.partNo || '').toLowerCase().includes(q) ||
      (it.partName || '').toLowerCase().includes(q) ||
      (it.barcode || '').toLowerCase().includes(q)
    )
  }, [issuedItems, searchText])

  const handleSelectRow = (idx) => {
    if (selectedGridRows.includes(idx)) {
      setSelectedGridRows(rows => rows.filter(r => r !== idx))
    } else {
      setSelectedGridRows(rows => [...rows, idx])
    }
  }

  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">
      
      {/* 1. Static Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stores</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[13px] font-bold text-slate-700 uppercase tracking-wide">Material Issue Entry</span>
         
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold rounded text-[12px] transition-colors shadow-sm">
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded text-[12px] transition-colors shadow-sm"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* 2. Scrollable Middle Content Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        
        {/* Top Section: Item Issue Details & Receiver Details Panel */}
        <div className="grid grid-cols-12 gap-5 items-start">
          
          {/* Card C: Transaction Item Entry Form (Left) */}
          <div className="col-span-12 lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
                  <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Issue Details</h3>
                </div>
                <div className="flex justify-end gap-3 shrink-0">
                  <button
                    onClick={clearTransactionFields}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded shadow-sm transition-all"
                  >
                    <RotateCcw size={14} /> Clear Item Fields
                  </button>
                  <button
                    onClick={handleSaveItem}
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow transition-all active:scale-95"
                  >
                    <Save size={14} /> Add Item to Grid
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>S.Job No</label>
                  <Combobox
                    options={serviceJobNoOptions}
                    placeholder="Select Job No"
                    value={serviceJobNo}
                    onChange={handleJobNoChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>S.Part No</label>
                  <Combobox
                    options={servicePartNoOptions}
                    placeholder="Select Part No"
                    value={servicePartNo}
                    onChange={handleServicePartNoChange}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Barcode</label>
                  <select
                    value={barcodeSearch}
                    onChange={e => handleBarcodeChange(e.target.value)}
                    className={inp(false)}
                  >
                    <option value="">-- Select Barcode --</option>
                    {barcodeList.map(b => (
                      <option key={b.barcode} value={b.barcode} disabled={b.stockQty === 0}>
                        {b.barcode} {b.stockQty === 0 ? '(Out of Stock)' : `(Stock: ${b.stockQty})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Part No</label>
                  <input value={partNo} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Part Name</label>
                  <input value={partName} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>UOM</label>
                  <input value={uom} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Brand</label>
                  <input value={brand} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Description</label>
                  <input value={description} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Spec</label>
                  <input value={spec} readOnly placeholder="Auto-populated" className={inp(true)} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Issue Qty</label>
                  <input
                    value={qty}
                    onChange={e => handleQtyChange(e.target.value)}
                    placeholder="Enter Qty"
                    className={inp(false)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Rate</label>
                  <input
                    value={rate ? `₹${parseFloat(rate).toFixed(2)}` : ''}
                    readOnly
                    placeholder="Auto-calculated"
                    className={inp(true)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className={lbl}>Amount</label>
                  <input
                    value={amount ? `₹${parseFloat(amount).toFixed(2)}` : ''}
                    readOnly
                    placeholder="Auto-calculated"
                    className={inp(true)}
                  />
                </div>
              </div>
            </div>

            
          </div>

          {/* Card B: BOM Details & Stock Info (Right) */}
          <div className="col-span-12 lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col min-h-[360px] space-y-4">
            
            {/* Part Image & Stock Info at the top */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col">
                <span className={lbl}>Part Image</span>
                <div className="w-full h-[110px] mt-1.5 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shadow-inner">
                  {partImageSrc ? (
                    <img src={partImageSrc} alt="Part" className="h-full w-full object-contain" />
                  ) : (
                    <Camera size={26} className="opacity-30 text-slate-400" />
                  )}
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className={lbl}>Part Stock Details</span>
                <div className="space-y-1.5 mt-1.5 bg-slate-50 p-3 border border-slate-200 rounded-lg text-slate-600 text-[11px] h-[110px] overflow-y-auto shadow-inner">
                  <div className="flex justify-between border-b border-slate-200/50 pb-1">
                    <span>Avail Stock:</span>
                    <span className="text-blue-600 font-bold">{availableStock.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Rq.Qty:</span>
                    <span className="text-slate-800 font-semibold">{selectedBomItem?.requiredQty || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Iss.Qty:</span>
                    <span className="text-slate-800 font-semibold">{selectedBomItem?.issuedQty || '—'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 pt-0.5 border-t border-slate-200/50">
                    <span>Bal.Qty:</span>
                    <span>{selectedBomItem?.balanceQty || '—'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* BOM List Details at the bottom with a top border */}
            <div className="flex-grow flex flex-col border-t border-slate-100 pt-4 mt-2">
              <div className="flex items-center justify-between pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
                  <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">BOM List Details ({bomItems.length || 0})</span>
                </div>
              </div>
              
              <div className="flex-1 border border-slate-200 bg-white rounded-lg overflow-hidden flex flex-col shadow-inner">
                <div className="overflow-y-auto max-h-[140px] w-full">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-2 border-r border-slate-200 w-10 text-center">S.No</th>
                        <th className="px-3 py-2 border-r border-slate-200">Part No</th>
                        <th className="px-3 py-2 border-r border-slate-200 text-right">Bal. Qty</th>
                        <th className="px-3 py-2 text-center">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {bomItems.length === 0 ? (
                        <tr className="text-slate-400 italic text-center">
                          <td colSpan={4} className="py-6">No BOM records. Select Job & Part No.</td>
                        </tr>
                      ) : (
                        bomItems.map((item, idx) => (
                          <tr
                            key={item.id}
                            onClick={() => handleSelectBomItem(item)}
                            className={`cursor-pointer hover:bg-cyan-50/30 transition-all ${selectedBomItem?.id === item.id ? 'bg-[#0097A7]/5 font-semibold text-[#0097A7]' : ''
                              }`}
                          >
                            <td className="px-3 py-2 text-center font-bold text-slate-400">{idx + 1}</td>
                            <td className="px-3 py-2 font-mono font-semibold text-blue-600">{item.partNo}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-800">{item.balanceQty.toFixed(2)}</td>
                            <td className="px-3 py-2 text-center">{item.uom}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Section: Document Details & BOM / Stock details */}
        <div className="grid grid-cols-12 gap-5">
          
          {/* Card A: Document Fields (Left) */}
          <div className="col-span-12 lg:col-span-7 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Document Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Issue No</label>
                <input 
                  value={issueNo} 
                  readOnly 
                  className={inp(true, "bg-amber-50/40 text-slate-700 font-bold font-mono border-amber-200")} 
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Issue Date</label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={e => setIssueDate(e.target.value)}
                  className={inp(false)}
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Department</label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className={inp(false)}
                >
                  <option value="Production">Production</option>
                  <option value="Service">Service</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Stores">Stores</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={lbl}>* Model</label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  disabled={!!serviceJobNo}
                  className={inp(!!serviceJobNo, model === '' ? 'border-red-400 focus:ring-red-200' : '')}
                >
                  <option value="">-- Select Model --</option>
                  {models.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 lg:col-span-2">
                <label className={lbl}>* Remarks / Description</label>
                <input
                  value={remarks}
                  onChange={e => setRemarks(e.target.value)}
                  placeholder="Enter remarks (required)"
                  className={inp(false, remarks === '' ? 'border-red-400 focus:ring-red-200' : '')}
                />
              </div>
            </div>
          </div>

          {/* Card D: Receiver & Customer Details (Right - Compact 2x2 Grid) */}
          <div className="col-span-12 lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
              <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Receiver & Customer Details</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* Row 1, Col 1: Incharge Name */}
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Incharge Name</label>
                <select
                  value={inchargeName}
                  onChange={e => setInchargeName(e.target.value)}
                  className={inp(false)}
                >
                  <option value="">-- Select Incharge --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.empName}>{emp.empName}</option>)}
                </select>
              </div>

              {/* Row 1, Col 2: Receiver Name */}
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Receiver Name</label>
                <select
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                  className={inp(false)}
                >
                  <option value="">-- Select Receiver --</option>
                  {employees.map(emp => <option key={emp.id} value={emp.empName}>{emp.empName}</option>)}
                </select>
              </div>

              {/* Row 2, Col 1: Customer Code */}
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Customer Code</label>
                <input 
                  type="text" 
                  value={customerCode} 
                  readOnly 
                  placeholder="Auto-populated"
                  className={inp(true)} 
                />
              </div>

              {/* Row 2, Col 2: Customer Name */}
              <div className="flex flex-col gap-1.5">
                <label className={lbl}>Customer Name</label>
                <input 
                  type="text" 
                  value={customerName} 
                  readOnly 
                  placeholder="Auto-populated"
                  className={inp(true)} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Issued Items Grid Table (Full Width) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
              <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Issued Items List</h3>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 w-64 relative">
                <Search size={14} className="text-slate-400 absolute left-2.5" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search in grid..."
                  className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-2.5 py-1 h-[30px] text-[12px] focus:outline-none focus:bg-white focus:border-[#0097A7]"
                />
              </div>
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded text-[11px] transition-colors"
              >
                <Trash2 size={13} /> Delete Selected
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-inner bg-slate-50">
            <table className="w-full text-left border-collapse min-w-[1000px] text-[12px]">
              <thead className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2 w-12 text-center border-r border-slate-200">
                    <input
                      type="checkbox"
                      checked={filteredIssuedItems.length > 0 && selectedGridRows.length === filteredIssuedItems.length}
                      onChange={() => {
                        if (selectedGridRows.length === filteredIssuedItems.length) {
                          setSelectedGridRows([])
                        } else {
                          setSelectedGridRows(filteredIssuedItems.map((_, i) => i))
                        }
                      }}
                      className="w-4 h-4 accent-[#0097A7] rounded"
                    />
                  </th>
                  <th className="px-3 py-2 w-16 text-center border-r border-slate-200">S.No</th>
                  <th className="px-3 py-2 border-r border-slate-200">Customer Code</th>
                  <th className="px-3 py-2 border-r border-slate-200">Barcode</th>
                  <th className="px-3 py-2 border-r border-slate-200">Part No</th>
                  <th className="px-3 py-2 border-r border-slate-200">Part Name</th>
                  <th className="px-3 py-2 border-r border-slate-200">Spec</th>
                  <th className="px-3 py-2 text-center w-24 border-r border-slate-200">Qty</th>
                  <th className="px-3 py-2 text-center w-24 border-r border-slate-200">UOM</th>
                  <th className="px-3 py-2 text-right w-28 border-r border-slate-200">Price</th>
                  <th className="px-3 py-2 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredIssuedItems.length === 0 ? (
                  <tr className="h-28 text-center text-slate-400 italic">
                    <td colSpan={11}>No items added yet. Complete the form and click 'Add Item to Grid'.</td>
                  </tr>
                ) : (
                  filteredIssuedItems.map((row, idx) => (
                    <tr
                      key={row.id}
                      className={`h-9 hover:bg-[#f0f9fa]/40 transition-colors ${selectedGridRows.includes(idx) ? 'bg-[#00BCD4]/5' : ''
                        }`}
                    >
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center">
                        <input
                          type="checkbox"
                          checked={selectedGridRows.includes(idx)}
                          onChange={() => handleSelectRow(idx)}
                          className="w-4 h-4 accent-[#0097A7] rounded"
                        />
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 font-semibold text-slate-600">
                        {row.customerCode || '—'}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-slate-600">
                        {row.barcode || '—'}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 font-bold text-[#0097A7] font-mono">
                        {row.partNo}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 font-semibold text-slate-700">
                        {row.partName}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-slate-500">
                        {row.spec || '—'}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center font-bold text-slate-800">
                        {row.qty.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-600 font-semibold">
                        {row.uom || '—'}
                      </td>
                      <td className="px-3 py-1.5 border-r border-slate-100 text-right font-medium text-slate-700">
                        ₹{row.price.toFixed(2)}
                      </td>
                      <td className="px-3 py-1.5 text-right font-black text-emerald-600">
                        ₹{row.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))
                )}
                {/* Empty rows filler */}
                {filteredIssuedItems.length < 5 && [...Array(5 - filteredIssuedItems.length)].map((_, i) => (
                  <tr key={i} className="h-9 bg-slate-50/10">
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td className="border-r border-slate-100"></td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* 3. Fixed Bottom Action Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="flex gap-3">
          <button
            onClick={handleClearAll}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded text-[13px] transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmitIssue}
            disabled={submitting}
            className="flex items-center justify-center gap-1.5 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white font-bold rounded text-[13px] shadow disabled:opacity-60 transition-colors active:scale-95"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
            Submit
          </button>
        </div>
        
        <div className="flex gap-8 text-[13.5px] font-bold text-slate-700 uppercase bg-slate-50 px-6 py-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span>Total Qty:</span>
            <span className="text-blue-600 font-black text-[15px] tabular-nums">{totalQty.toFixed(2)}</span>
          </div>
          <div className="border-l border-slate-200 pl-8 flex items-center gap-2">
            <span>Total Price:</span>
            <span className="text-emerald-600 font-black text-[15px] tabular-nums">₹{totalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

    </div>
  )
}
