import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ChevronRight, X, Search, Save, Trash2, Loader2, FileSpreadsheet, RotateCcw, Camera
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

// Helper Styling primitives
const inp = (readOnly = false, className = '') =>
  `w-full px-2.5 py-1 text-[13px] h-[32px] border border-slate-350 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${
    readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-bold font-mono' : 'hover:border-slate-405'
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

  // References Data
  const [departments, setDepartments] = useState([])
  const [models, setModels] = useState([])
  const [employees, setEmployees] = useState([])
  const [customers, setCustomers] = useState([])
  const [itemMasterList, setItemMasterList] = useState([])
  const [jobsList, setJobsList] = useState([])

  // States
  const [loading, setLoading] = useState(true)
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

  // BOM items list
  const [bomItems, setBomItems] = useState([])
  const [selectedBomItem, setSelectedBomItem] = useState(null)
  const [showBOM, setShowBOM] = useState(true)

  // Main table list
  const [issuedItems, setIssuedItems] = useState([])
  const [searchText, setSearchText] = useState('')
  const [selectedGridRows, setSelectedGridRows] = useState([]) // indices of rows selected in the main grid

  // Load Initial Master Data
  const loadInitialData = async () => {
    setLoading(true)
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
      setLoading(false)
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
    setBomItems([])
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
      const sparesRes = await api.get('/api/service-spare')
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
      setBomItems([])
      return
    }

    try {
      const bomRes = await api.get(`/api/material-issue/bom-items?servicePartNo=${encodeURIComponent(val)}&serviceJobNo=${encodeURIComponent(serviceJobNo)}`)
      const items = bomRes.data?.data || []
      const filtered = items.filter(it => {
        const localIssued = issuedItems.filter(li => li.partNo === it.partNo).reduce((sum, li) => sum + li.qty, 0)
        return it.balanceQty - localIssued > 0
      })
      setBomItems(filtered)
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
      const bcRes = await api.get(`/api/material-issue/barcodes?partNo=${encodeURIComponent(item.partNo)}`)
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

    if (servicePartNo) {
      handleServicePartNoChange(servicePartNo)
    }
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

    if (servicePartNo) {
      handleServicePartNoChange(servicePartNo)
    }
  }

  // Clear Form
  const handleClearAll = () => {
    setServiceJobNo('')
    setServicePartNo('')
    setBomItems([])
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
      await api.post('/api/material-issue', payload)
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
    const matched = itemMasterList.find(im => im.partNo === partNo)
    if (matched && matched.imagePath) {
      return matched.imagePath
    }
    return null
  }, [partNo, itemMasterList])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0097A7]" />
      </div>
    )
  }

  return (
    <div className="bg-[#f4f6f8] min-h-screen text-slate-800 pb-10">
      <div className="px-6 py-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase">Stores</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase">Material Issue</span>
        </div>

        {/* Outer Frame */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[900px]">
          
          {/* Main Top Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Material Issue Entry</h2>
            </div>
            <div className="flex items-center gap-4 text-[12.5px] text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer font-bold">
                <input
                  type="checkbox"
                  checked={validate}
                  onChange={e => setValidate(e.target.checked)}
                  className="w-4 h-4 accent-[#0097A7]"
                />
                Validate
              </label>
              <button className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold rounded text-[11.5px] transition-colors">
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
                className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 font-bold rounded text-[11.5px] transition-colors shadow-sm"
              >
                <X size={14} /> Close
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col space-y-6">
            
            {/* Top Layout - Header Panels */}
            <div className="grid grid-cols-12 gap-5 items-stretch">
              
              {/* Column 1 - Left Document Details */}
              <div className="col-span-12 md:col-span-4 space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <label className={`${lbl} w-[100px] shrink-0`}>Issue No :</label>
                  <input value={issueNo} readOnly className={`${inp(true)} bg-yellow-50/60 font-semibold text-slate-700`} />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`${lbl} w-[100px] shrink-0`}>Issue Date :</label>
                  <input
                    type="date"
                    value={issueDate}
                    onChange={e => setIssueDate(e.target.value)}
                    className={inp(false)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`${lbl} w-[100px] shrink-0`}>Department :</label>
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
                <div className="flex items-center gap-2">
                  <label className={`${lbl} w-[100px] shrink-0`}>* Remarks :</label>
                  <input
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Required"
                    className={inp(false, remarks === '' ? 'border-red-400' : '')}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className={`${lbl} w-[100px] shrink-0`}>* Model :</label>
                  <select
                    value={model}
                    onChange={e => setModel(e.target.value)}
                    disabled={!!serviceJobNo}
                    className={inp(!!serviceJobNo, model === '' ? 'border-red-400' : '')}
                  >
                    <option value="">-- Select Model --</option>
                    {models.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              {/* Right Side container - spans 8 columns */}
              <div className="col-span-12 md:col-span-8 flex flex-col gap-4">
                
                {/* Nested Grid for Incharge & Customer details (left) and Part Image & Stock Details (right) */}
                <div className="grid grid-cols-12 gap-4">
                  
                  {/* Incharge & Customer details */}
                  <div className="col-span-12 md:col-span-6 space-y-2.5 bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <label className={`${lbl} w-[110px] shrink-0`}>Incharge Name:</label>
                      <select
                        value={inchargeName}
                        onChange={e => setInchargeName(e.target.value)}
                        className={inp(false)}
                      >
                        <option value="">-- Select Incharge --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.empName}>{emp.empName}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`${lbl} w-[110px] shrink-0`}>Receiver Name:</label>
                      <select
                        value={receiverName}
                        onChange={e => setReceiverName(e.target.value)}
                        className={inp(false)}
                      >
                        <option value="">-- Select Receiver --</option>
                        {employees.map(emp => <option key={emp.id} value={emp.empName}>{emp.empName}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`${lbl} w-[110px] shrink-0`}>Cus. Name :</label>
                      <input type="text" value={customerName} readOnly className={inp(true)} />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className={`${lbl} w-[110px] shrink-0`}>Cus. Code :</label>
                      <input type="text" value={customerCode} readOnly className={inp(true)} />
                    </div>
                  </div>

                  {/* Part Image & Stock Info */}
                  <div className="col-span-12 md:col-span-6 grid grid-cols-2 gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm text-[12px]">
                    <div className="flex flex-col">
                      <span className={lbl}>Part Image</span>
                      <div className="w-full h-[120px] mt-1 border border-slate-250 bg-white rounded flex items-center justify-center overflow-hidden shadow-inner">
                        {partImageSrc ? (
                          <img src={partImageSrc} alt="Part" className="h-full w-full object-contain" />
                        ) : (
                          <Camera size={28} className="opacity-20 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className={lbl}>Part Stock Details</span>
                      <div className="space-y-1 mt-1 bg-white p-2 border border-slate-250 rounded font-semibold text-slate-600 text-[11px] w-full h-[120px] overflow-y-auto shadow-inner">
                        <div>Avail Stock: <span className="text-blue-600 font-bold">{availableStock.toFixed(2)}</span></div>
                        <div>Location: <span className="text-slate-500 font-normal">—</span></div>
                        <div>Rq.Qty: <span className="text-slate-800">{selectedBomItem?.requiredQty || '—'}</span></div>
                        <div>Iss.Qty: <span className="text-slate-800">{selectedBomItem?.issuedQty || '—'}</span></div>
                        <div>Bal.Qty: <span className="text-slate-800">{selectedBomItem?.balanceQty || '—'}</span></div>
                      </div>
                    </div>
                  </div>

                </div>

                {/* BOM List details */}
                <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-200 shadow-sm w-full transition-all duration-200">
                  <div className="flex items-center justify-between cursor-pointer select-none border-b pb-1.5 mb-2" onClick={() => setShowBOM(!showBOM)}>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-3 bg-[#0097A7] rounded-sm" />
                      <span className="text-[11.5px] font-bold text-slate-600 uppercase tracking-wide">BOM List Details ({bomItems.length || 0})</span>
                    </div>
                    <span className="text-[10.5px] font-extrabold text-[#0097A7] uppercase hover:underline">
                      {showBOM ? 'Collapse BOM' : 'Expand BOM'}
                    </span>
                  </div>
                  {showBOM && (
                    <div className="flex flex-col">
                      <div className="h-[120px] border border-slate-200 bg-white rounded overflow-x-auto text-[11px] overflow-y-auto shadow-inner">
                        <table className="w-full text-left border-collapse">
                          <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 font-bold uppercase sticky top-0">
                            <tr>
                              <th className="px-2 py-1.5 border-r border-slate-200 w-10 text-center">S.No</th>
                              <th className="px-3 py-1.5 border-r border-slate-200">Part No</th>
                              <th className="px-3 py-1.5 border-r border-slate-200">Part Name</th>
                              <th className="px-3 py-1.5 border-r border-slate-200 text-right">Bal. Qty</th>
                              <th className="px-3 py-1.5 text-center">UOM</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-700">
                            {bomItems.length === 0 ? (
                              <tr className="text-slate-400 italic text-center">
                                <td colSpan={5} className="py-8">No BOM records loaded. Select Job and Part No to fetch BOM.</td>
                              </tr>
                            ) : (
                              bomItems.map((item, idx) => (
                                <tr
                                  key={item.id}
                                  onClick={() => handleSelectBomItem(item)}
                                  className={`cursor-pointer hover:bg-cyan-50/20 transition-all ${
                                    selectedBomItem?.id === item.id ? 'bg-cyan-50 font-semibold text-[#0097A7]' : ''
                                  }`}
                                >
                                  <td className="px-2 py-1.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                  <td className="px-3 py-1.5 font-mono font-bold text-blue-600">{item.partNo}</td>
                                  <td className="px-3 py-1.5 truncate max-w-[200px]">{item.partName}</td>
                                  <td className="px-3 py-1.5 text-right font-bold text-slate-900">{item.balanceQty.toFixed(2)}</td>
                                  <td className="px-3 py-1.5 text-center">{item.uom}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                {/* Save, Delete, Clear Action Buttons */}
                <div className="flex justify-end gap-3 bg-slate-50 border border-slate-200 p-2.5 rounded-xl shadow-sm">
                  <button
                    onClick={handleSubmitIssue}
                    disabled={submitting}
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow transition-all active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Submit All
                  </button>
                  <button
                    onClick={handleDeleteSelected}
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-red-500 hover:bg-red-650 text-white text-[12px] font-bold rounded shadow transition-all active:scale-95"
                  >
                    <Trash2 size={14} />
                    Delete Selected
                  </button>
                  <button
                    onClick={handleClearAll}
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-slate-600 hover:bg-slate-700 text-white text-[12px] font-bold rounded shadow transition-all active:scale-95"
                  >
                    <RotateCcw size={14} />
                    Reset Form
                  </button>
                </div>

              </div>

            </div>

            {/* Row Input Area for Adding Items */}
            <div className="bg-[#f0f9ff]/40 border border-sky-100 p-3.5 rounded-xl shadow-sm text-slate-700">
              <div className="grid grid-cols-12 gap-x-4 gap-y-3 text-[12.5px]">

                {/* Row 1 */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">S.Job No :</span>
                  <Combobox
                    options={serviceJobNoOptions}
                    placeholder="Select Job No"
                    value={serviceJobNo}
                    onChange={handleJobNoChange}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">S.PartNo :</span>
                  <Combobox
                    options={servicePartNoOptions}
                    placeholder="Select Part No"
                    value={servicePartNo}
                    onChange={handleServicePartNoChange}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Barcode :</span>
                  <select
                    value={barcodeSearch}
                    onChange={e => handleBarcodeChange(e.target.value)}
                    className="w-full px-2.5 py-1 text-[13px] h-[32px] border border-slate-350 rounded bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7]"
                  >
                    <option value="">-- Select Barcode --</option>
                    {barcodeList.map(b => (
                      <option key={b.barcode} value={b.barcode} disabled={b.stockQty === 0}>
                        {b.barcode} {b.stockQty === 0 ? '(Out of Stock)' : `(Stock: ${b.stockQty})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Part No :</span>
                  <input
                    value={partNo}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                {/* Row 2 */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Part Name :</span>
                  <input value={partName} readOnly className={inp(true)} />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Description:</span>
                  <input
                    value={description}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Spec :</span>
                  <input
                    value={spec}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Brand :</span>
                  <input
                    value={brand}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                {/* Row 3 */}
                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Qty :</span>
                  <input
                    value={qty}
                    onChange={e => handleQtyChange(e.target.value)}
                    placeholder="Qty"
                    className={inp(false)}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">UOM :</span>
                  <input
                    value={uom}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Rate :</span>
                  <input
                    value={rate ? `₹${parseFloat(rate).toFixed(2)}` : ''}
                    readOnly
                    className={inp(true)}
                  />
                </div>

                <div className="col-span-12 sm:col-span-6 md:col-span-3 flex items-center gap-1.5">
                  <span className="w-[78px] text-[11.5px] font-semibold text-slate-600 text-left shrink-0">Amount :</span>
                  <input value={amount ? `₹${parseFloat(amount).toFixed(2)}` : ''} readOnly className={inp(true)} />
                </div>

              </div>
            </div>

            {/* Action & Search Bar */}
            <div className="flex items-center justify-between bg-slate-100 border border-slate-200 p-2.5 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 w-72">
                <Search size={16} className="text-slate-400" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  placeholder="Search in Grid (Part No, Name, Barcode)..."
                  className="w-full bg-white border border-slate-300 rounded px-2.5 py-1 h-[32px] text-[12.5px] focus:outline-none focus:border-[#0097A7]"
                />
              </div>
              <button
                onClick={handleSaveItem}
                className="flex items-center gap-1.5 px-5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded shadow transition-all active:scale-95"
              >
                <Save size={14} /> Add Item to Grid
              </button>
            </div>

            {/* Issue Grid Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-inner bg-slate-50 flex-1">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    <th className="px-3 py-2.5 border-r border-slate-300 w-12 text-center">
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
                        className="w-4 h-4 accent-[#0097A7]"
                      />
                    </th>
                    <th className="px-3 py-2.5 border-r border-slate-300 w-16 text-center">S.No</th>
                    <th className="px-3 py-2.5 border-r border-slate-300">Customer Code</th>
                    <th className="px-3 py-2.5 border-r border-slate-300">Barcode</th>
                    <th className="px-3 py-2.5 border-r border-slate-300">Part No</th>
                    <th className="px-3 py-2.5 border-r border-slate-300">Part Name</th>
                    <th className="px-3 py-2.5 border-r border-slate-300">Spec</th>
                    <th className="px-3 py-2.5 border-r border-slate-300 text-center w-24">Qty</th>
                    <th className="px-3 py-2.5 border-r border-slate-300 text-center w-24">UOM</th>
                    <th className="px-3 py-2.5 border-r border-slate-300 text-right w-32">Price</th>
                    <th className="px-3 py-2.5 text-right w-32">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12.5px] bg-white">
                  {filteredIssuedItems.length === 0 ? (
                    <tr className="h-32 text-center text-slate-400 italic">
                      <td colSpan={11}>No items added to the issue list. Enter details above and click 'Add Item to Grid'.</td>
                    </tr>
                  ) : (
                    filteredIssuedItems.map((row, idx) => (
                      <tr
                        key={row.id}
                        className={`h-10 hover:bg-[#f0f9fa]/50 transition-colors ${selectedGridRows.includes(idx) ? 'bg-[#00BCD4]/5' : ''
                          }`}
                      >
                        <td className="px-3 py-2 border-r border-slate-100 text-center">
                          <input
                            type="checkbox"
                            checked={selectedGridRows.includes(idx)}
                            onChange={() => handleSelectRow(idx)}
                            className="w-4 h-4 accent-[#0097A7] rounded"
                          />
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center font-bold text-slate-500 italic">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 font-semibold text-slate-600">
                          {row.customerCode || '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-slate-600">
                          {row.barcode || '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 font-bold text-[#0097A7]">
                          {row.partNo}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 font-semibold text-slate-700">
                          {row.partName}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-slate-500">
                          {row.spec || '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center font-bold text-slate-800">
                          {row.qty.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center text-slate-600 font-semibold">
                          {row.uom || '—'}
                        </td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right font-medium text-slate-700">
                          ₹{row.price.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-black text-emerald-600">
                          ₹{row.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                  {/* Empty rows filler */}
                  {filteredIssuedItems.length < 8 && [...Array(8 - filteredIssuedItems.length)].map((_, i) => (
                    <tr key={i} className="h-10 bg-slate-50/20">
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

            {/* Bottom Controls / Cancel & Submit / Totals */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 mt-2">
              <div className="flex gap-3">
                <button
                  onClick={handleClearAll}
                  className="px-6 py-2 bg-orange-500 hover:bg-orange-650 text-white font-bold rounded text-[13px] shadow transition-colors active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitIssue}
                  disabled={submitting}
                  className="flex items-center justify-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[13px] shadow disabled:opacity-60 transition-colors active:scale-95"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Submit
                </button>
              </div>
              <div className="flex gap-8 text-[14px] font-bold text-slate-800 uppercase bg-slate-50 px-6 py-2 rounded-lg border border-slate-200 shadow-sm">
                <div>
                  Total Qty : <span className="text-blue-600 ml-1 font-black tabular-nums">{totalQty.toFixed(2)}</span>
                </div>
                <div className="border-l border-slate-350 pl-8">
                  Total Price : <span className="text-emerald-600 ml-1 font-black tabular-nums">₹{totalPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
