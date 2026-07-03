import { useState, useEffect, useMemo, useRef } from 'react'
import {
  ChevronRight, Save, X, Search, RotateCcw,
  FileSpreadsheet, Camera, Plus, Loader2, Send, FileText, Trash2
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useCustomers, useReferenceMaster } from '../hooks/useMasterData'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// ── Shared UI primitives ──
const Label = ({ children, required, className = "" }) => (
  <label className={`text-[12px] font-semibold text-slate-600 whitespace-nowrap ${className}`}>
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "", ...props }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-2.5 py-1 text-[12.5px] h-[32px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-semibold font-mono border-slate-200' : 'border-slate-300 hover:border-slate-400'} shadow-sm ${className}`}
    {...props}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative group ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2.5 py-1 h-[32px] pr-8 text-[12.5px] border border-slate-300 rounded bg-white text-slate-800 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 hover:border-slate-400 cursor-pointer shadow-sm"
    >
      <option value="">{placeholder || '-- Select --'}</option>
      {options.map(o => {
        const val = typeof o === 'object' ? o.value : o
        const lbl = typeof o === 'object' ? o.label : o
        return <option key={val} value={val}>{lbl}</option>
      })}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center group-hover:text-[#0097A7] transition-colors">
      <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const TextArea = ({ placeholder, value, onChange, className = "", rows = 3 }) => (
  <textarea
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-2.5 py-2 text-[12.5px] border border-slate-300 rounded bg-white text-slate-850 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 hover:border-slate-400 resize-none shadow-sm ${className}`}
  />
)

const Combobox = ({ options, placeholder, value, onChange, readOnly = false, className = '', ...props }) => {
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
    <div ref={containerRef} className={`relative w-full min-w-0 ${className}`}>
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
        className={`w-full px-2.5 py-1 text-[12.5px] h-[32px] border rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0097A7] focus:border-[#0097A7] transition-all duration-150 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-500 font-semibold font-mono border-slate-200' : 'border-slate-300 hover:border-slate-400'} shadow-sm`}
        {...props}
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
        <div className="absolute z-[10000] w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-72 overflow-y-auto">
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
                className="px-3 py-1.5 text-[12.5px] text-slate-700 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer transition-colors"
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

const getFinancialYearDC = () => {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const y1 = month >= 4 ? year : year - 1
  const fy = `${String(y1).slice(-2)}/${String(y1 + 1).slice(-2)}`
  return `${fy}DC0001`
}

export default function DCEntry() {
  const toast = useToast()
  const fileInputRef = useRef(null)

  // React Query master data fetches
  const { data: custsRes = [] } = useCustomers()
  const { data: workTypesRes = [] } = useReferenceMaster('work_type')

  const [suppliers, setSuppliers] = useState([])
  const [suppliersLoading, setSuppliersLoading] = useState(true)

  const parties = useMemo(() => {
    const formattedCust = custsRes.map(c => ({
      id: c.id,
      type: 'Customer',
      name: c.customerName,
      code: c.cCode,
      contactPerson: c.contactPerson || '',
      contactNo: c.mobile || c.phone || '',
      gstNo: c.gstNo || '',
      address: [c.address, c.address2, c.address3, c.address4, c.city, c.pinCode].filter(Boolean).join(', ')
    }))

    const formattedSupp = suppliers.map(s => ({
      id: s.id,
      type: 'Supplier',
      name: s.supplierName,
      code: s.sCode,
      contactPerson: s.contactPerson || '',
      contactNo: s.mobile || s.phone || '',
      gstNo: s.gstNo || '',
      address: [s.address, s.address2, s.address3, s.address4, s.city, s.pinCode].filter(Boolean).join(', ')
    }))

    return [...formattedCust, ...formattedSupp]
  }, [custsRes, suppliers])

  const itemsList = itemsRes
  const workTypes = useMemo(() => workTypesRes.map(item => item.description).filter(Boolean), [workTypesRes])
  const [selectedParty, setSelectedParty] = useState(null)

  const fetchNextDcNo = async () => {
    try {
      const res = await api.get('/api/delivery-challan/next-number', { skipGlobalLoader: true })
      if (res.data?.dcNo) {
        setDcNo(res.data.dcNo)
      } else {
        setDcNo(getFinancialYearDC())
      }
    } catch (err) {
      setDcNo(getFinancialYearDC())
    }
  }
  const [employees, setEmployees] = useState([])
  const [vehicles, setVehicles] = useState([])
  const [recentVehicles, setRecentVehicles] = useState([])
  const [recentDrivers, setRecentDrivers] = useState([])
  const [recentDesThroughs, setRecentDesThroughs] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Local storage options for manual entries
  const [localVehicles, setLocalVehicles] = useState(() => {
    const saved = localStorage.getItem('dc_manual_vehicles')
    return saved ? JSON.parse(saved) : []
  })
  const [localDrivers, setLocalDrivers] = useState(() => {
    const saved = localStorage.getItem('dc_manual_drivers')
    return saved ? JSON.parse(saved) : []
  })
  const [localDesThroughs, setLocalDesThroughs] = useState(() => {
    const saved = localStorage.getItem('dc_manual_des_throughs')
    return saved ? JSON.parse(saved) : []
  })

  // Header logistics state
  const [dcNo, setDcNo] = useState('')
  const [date, setDate] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerDetails, setCustomerDetails] = useState('')
  const [dcType, setDcType] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [contPerson, setContPerson] = useState('')
  const [driverName, setDriverName] = useState('')
  const [contactNo, setContactNo] = useState('')
  const [desThrough, setDesThrough] = useState('')
  const [gstNo, setGstNo] = useState('')
  const [imagePreview, setImagePreview] = useState(null)

  // Transaction item inputs state
  const [barcode, setBarcode] = useState('')
  const [partNo, setPartNo] = useState('')
  const [partName, setPartName] = useState('')
  const [spec, setSpec] = useState('')
  const [brand, setBrand] = useState('')
  const [qty, setQty] = useState('')
  const [uom, setUom] = useState('')
  const [rate, setRate] = useState('')
  const [amount, setAmount] = useState('')
  const [availableStock, setAvailableStock] = useState(0.0)
  const [barcodeType, setBarcodeType] = useState('')
  const [stockLocation, setStockLocation] = useState('')
  const [heatTreatment, setHeatTreatment] = useState('')
  const [mGrade, setMGrade] = useState('')
  const [hrc, setHrc] = useState('')
  const [weight, setWeight] = useState('')
  const [details, setDetails] = useState('')
  const [workType, setWorkType] = useState('')
  const [rework, setRework] = useState('')

  // Barcode and Stock list for selection
  const [barcodeList, setBarcodeList] = useState([])
  const [selectedBarcodeObj, setSelectedBarcodeObj] = useState(null)

  // Table items list
  const [items, setItems] = useState([])
  const [termsOfDelivery, setTermsOfDelivery] = useState('')

  const fetchRecentValues = async () => {
    try {
      const res = await api.get('/api/delivery-challan/recent-values', { skipGlobalLoader: true })
      if (res.data) {
        setRecentVehicles(res.data.vehicles || [])
        setRecentDrivers(res.data.drivers || [])
        setRecentDesThroughs(res.data.desThroughs || [])
      }
    } catch (err) {
      console.error('Failed to load recent values:', err)
    }
  }

  // Load masters on mount
  useEffect(() => {
    const fetchMasters = async () => {
      setLoading(true)
      try {
        const todayStr = new Date().toISOString().split('T')[0]
        setDate(todayStr)
        await fetchNextDcNo()

        const suppRes = await api.get('/api/supplier-master', { skipGlobalLoader: true })
        setSuppliers(suppRes.data?.data || [])

        await fetchRecentValues()
      } catch (err) {
        console.error(err)
        toast.error('Failed to load master lists')
      } finally {
        setLoading(false)
      }
    }
    fetchMasters()
  }, [])

  // Derived arrays for inputs
  const partyNames = useMemo(() => parties.map(p => p.name).filter(Boolean), [parties])
  const partNumbers = useMemo(() => itemsList.map(i => i.partNo).filter(Boolean), [itemsList])
  const driverNames = useMemo(() => {
    return [...new Set([...recentDrivers, ...localDrivers])]
  }, [recentDrivers, localDrivers])

  const vehicleNumbers = useMemo(() => {
    return [...new Set([...recentVehicles, ...localVehicles])]
  }, [recentVehicles, localVehicles])

  const desThroughOptions = useMemo(() => {
    return [...new Set([...recentDesThroughs, ...localDesThroughs])]
  }, [recentDesThroughs, localDesThroughs])

  const partImageSrc = useMemo(() => {
    if (!partNo) return null
    const matched = itemsList.find(im => im.partNo === partNo)
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
  }, [partNo, itemsList])

  const displayImage = imagePreview || partImageSrc

  // Select Customer auto-population
  const handleCustomerChange = (val) => {
    setCustomerName(val)
    if (!val) {
      setCustomerDetails('')
      setGstNo('')
      setContPerson('')
      setContactNo('')
      setSelectedParty(null)
      return
    }
    const match = parties.find(p => p.name === val)
    if (match) {
      setSelectedParty(match)
      setGstNo(match.gstNo || '')
      setContPerson(match.contactPerson || '')
      setContactNo(match.contactNo || '')
      setCustomerDetails(match.address || '')
    } else {
      setSelectedParty(null)
    }
  }

  // Select Part No auto-population
  const handlePartNoChange = async (val) => {
    setPartNo(val)
    setBarcode('')
    setBarcodeList([])
    setSelectedBarcodeObj(null)
    setAvailableStock(0.0)
    setStockLocation('')
    setBarcodeType('')

    if (!val) {
      setPartName('')
      setSpec('')
      setBrand('')
      setRate('')
      setAmount('')
      return
    }

    const match = itemsList.find(i => i.partNo === val)
    if (match) {
      setPartName(match.partName || '')
      setSpec(match.description || '')
      setBrand(match.brand || '')
      setRate(match.rate || match.purchaseRate || '')
      setStockLocation(match.location || '')
      setMGrade(match.materialGradeName || '')
      // setHrc(match.remark || '')
      setWeight(match.weight || '')
      setBarcodeType(match.barcodeType)
      if (qty && (match.rate || match.purchaseRate)) {
        setAmount((parseFloat(qty) * parseFloat(match.rate || match.purchaseRate)).toFixed(2))
      }
    }

    // Load available stock barcodes for this part
    try {
      const bcRes = await api.get(`/api/material-issue/barcodes?partNo=${encodeURIComponent(val)}`)
      const list = bcRes.data?.data || []
      const updatedList = list.map(bc => {
        const localDeducted = items
          .filter(li => li.partNo === val && li.barcode === bc.barcode)
          .reduce((sum, li) => sum + li.qty, 0)
        return {
          ...bc,
          stockQty: Math.max(0, bc.stockQty - localDeducted)
        }
      }).filter(bc => bc.stockQty > 0) // Only keep barcodes with remaining stock

      setBarcodeList(updatedList)

      // Calculate total available stock across all barcodes
      const totalAvail = updatedList.reduce((sum, bc) => sum + bc.stockQty, 0)
      setAvailableStock(totalAvail)

      // Auto-select if only 1 barcode is available
      if (updatedList.length === 1) {
        setBarcode(updatedList[0].barcode)
        setSelectedBarcodeObj(updatedList[0])
        const finalRate = updatedList[0].rate || match?.rate || match?.purchaseRate || rate || 0
        setRate(finalRate)

        const bType = match?.barcodeType
        if (bType === 'Multiple') {
          const itemQty = 1.0
          setQty(itemQty)
          setAmount((itemQty * finalRate).toFixed(2))
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Select Barcode auto-population
  const handleBarcodeChange = (val) => {
    setBarcode(val)
    const match = barcodeList.find(b => b.barcode === val)
    if (match) {
      setSelectedBarcodeObj(match)
      setAvailableStock(match.stockQty)
      const finalRate = match.rate || rate || 0
      setRate(finalRate)

      if (barcodeType === 'Multiple') {
        const itemQty = 1.0
        setQty(itemQty)
        setAmount((itemQty * finalRate).toFixed(2))
      } else {
        if (qty) {
          setAmount((parseFloat(qty) * finalRate).toFixed(2))
        }
      }
    } else {
      setSelectedBarcodeObj(null)
      setAvailableStock(0.0)
    }
  }

  const handleBarcodeSearch = async () => {
    if (!barcode) {
      toast.warning('Please enter or select a barcode to search')
      return
    }
    try {
      const res = await api.get(`/api/material-issue/barcode/${encodeURIComponent(barcode)}`)
      if (res.data?.success && res.data?.data) {
        const d = res.data.data
        setPartNo(d.partNo || '')
        setPartName(d.partName || '')
        setSpec(d.spec || '')
        setBrand(d.brand || '')
        setUom(d.uom || '')
        setRate(d.rate || '')
        setAvailableStock(d.availableStock || 0.0)
        setStockLocation(d.stockLocation || '')
        setMGrade(d.mGrade || '')
        setWeight(d.weight || '')
        setBarcodeType(d.barcodeType)

        setSelectedBarcodeObj({
          source: d.source,
          id: d.sourceId,
          barcode: barcode,
          stockQty: d.availableStock,
          rate: d.rate,
          uom: d.uom
        })

        const bType = d.barcodeType
        const finalRate = d.rate || 0
        if (bType === 'Multiple') {
          const itemQty = 1.0
          setQty(itemQty)
          setAmount((itemQty * finalRate).toFixed(2))
        } else {
          if (qty) {
            setAmount((parseFloat(qty) * finalRate).toFixed(2))
          }
        }

        if (d.partNo) {
          try {
            const bcRes = await api.get(`/api/material-issue/barcodes?partNo=${encodeURIComponent(d.partNo)}`)
            const list = bcRes.data?.data || []
            const updatedList = list.map(bc => {
              const localDeducted = items
                .filter(li => li.partNo === d.partNo && li.barcode === bc.barcode)
                .reduce((sum, li) => sum + li.qty, 0)
              return {
                ...bc,
                stockQty: Math.max(0, bc.stockQty - localDeducted)
              }
            }).filter(bc => bc.stockQty > 0)
            setBarcodeList(updatedList)
          } catch (bcErr) {
            console.error(bcErr)
          }
        }

        toast.success('Barcode details retrieved successfully')
      } else {
        toast.error('Barcode not found in GRN or Stock Adjustment')
      }
    } catch (err) {
      console.error(err)
      toast.error('Barcode not found in GRN or Stock Adjustment')
    }
  }

  // Qty and Rate change calculation
  const handleQtyChange = (val) => {
    setQty(val)
    const num = parseFloat(val)
    if (!isNaN(num) && rate) {
      setAmount((num * parseFloat(rate)).toFixed(2))
    } else {
      setAmount('')
    }
  }

  const handleRateChange = (val) => {
    setRate(val)
    const num = parseFloat(val)
    if (!isNaN(num) && qty) {
      setAmount((num * parseFloat(qty)).toFixed(2))
    } else {
      setAmount('')
    }
  }

  // Image browsing helper
  const triggerImageUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Actions
  const handleClearItemFields = () => {
    setBarcode('')
    setPartNo('')
    setPartName('')
    setSpec('')
    setBrand('')
    setQty('')
    setRate('')
    setAmount('')
    setAvailableStock(0.0)
    setStockLocation('')
    setHeatTreatment('')
    setMGrade('')
    setHrc('')
    setWeight('')
    setDetails('')
    setWorkType('')
    setBarcodeList([])
    setSelectedBarcodeObj(null)
    setBarcodeType('')
  }

  const handleClearAll = () => {
    fetchNextDcNo()
    setDate(new Date().toISOString().split('T')[0])
    setCustomerName('')
    setCustomerDetails('')
    setDcType('')
    setVehicleNo('')
    setContPerson('')
    setDriverName('')
    setContactNo('')
    setDesThrough('')
    setGstNo('')
    setImagePreview(null)
    setTermsOfDelivery('')
    setItems([])
    setSelectedParty(null)
    handleClearItemFields()
  }

  // Add Item to Table
  const handleSaveItem = () => {
    if (!partNo) {
      toast.warning('Please select a Part Number')
      return
    }
    const numQty = parseFloat(qty)
    if (isNaN(numQty) || numQty <= 0) {
      toast.warning('Quantity must be greater than 0')
      return
    }

    const numericRate = parseFloat(rate) || 0
    if (barcode && barcode !== 'N/A') {
      if (numQty > availableStock) {
        toast.warning(`Quantity (${numQty}) cannot exceed available stock (${availableStock}) for barcode ${barcode}`)
        return
      }
    }

    const newItem = {
      id: Date.now(),
      barcode: barcode || 'N/A',
      partNo,
      partName,
      spec: spec || null,
      brand: brand || null,
      qty: numQty,
      uom,
      rate: numericRate,
      amount: parseFloat(amount) || (numQty * numericRate),
      heatTreatment: heatTreatment || null,
      mGrade: mGrade || null,
      rework: rework || null,
      hrc: hrc || null,
      weight: weight || null,
      details: details || null,
      workType: workType || null,
      availableStock: parseFloat(availableStock) || 0,
      source: selectedBarcodeObj?.source || null,
      sourceId: selectedBarcodeObj?.id || null
    }

    setItems(prev => [...prev, newItem])
    toast.success('Item added to DC list')

    // Clear only barcode/selectedBarcodeObj, keep other fields!
    setBarcode('')
    setSelectedBarcodeObj(null)
    setAvailableStock(prev => Math.max(0, prev - numQty))
    setBarcodeList(prev => prev.map(bc => {
      if (bc.barcode === barcode) {
        return { ...bc, stockQty: Math.max(0, bc.stockQty - numQty) }
      }
      return bc
    }).filter(bc => bc.stockQty > 0))

  }

  const handleDeleteItem = (id) => {
    const deleted = items.find(item => item.id === id)
    setItems(prev => prev.filter(item => item.id !== id))
    toast.info('Item removed from list')
    if (deleted && deleted.partNo === partNo) {
      setAvailableStock(prev => prev + deleted.qty)
      if (deleted.barcode && deleted.barcode !== 'N/A') {
        setBarcodeList(prev => {
          if (prev.some(b => b.barcode === deleted.barcode)) {
            return prev.map(b => {
              if (b.barcode === deleted.barcode) {
                return { ...b, stockQty: b.stockQty + deleted.qty }
              }
              return b
            })
          }
          return [...prev, {
            barcode: deleted.barcode,
            stockQty: deleted.qty,
            rate: deleted.rate,
            uom: deleted.uom,
            source: deleted.source,
            id: deleted.sourceId
          }].sort((a, b) => a.barcode.localeCompare(b.barcode))
        })
      }
    }
  }



  const saveManualEntries = () => {
    if (vehicleNo && !vehicleNumbers.includes(vehicleNo)) {
      const newVehs = [...localVehicles, vehicleNo]
      setLocalVehicles(newVehs)
      localStorage.setItem('dc_manual_vehicles', JSON.stringify(newVehs))
    }
    if (driverName && !driverNames.includes(driverName)) {
      const newDrvs = [...localDrivers, driverName]
      setLocalDrivers(newDrvs)
      localStorage.setItem('dc_manual_drivers', JSON.stringify(newDrvs))
    }
    if (desThrough && !desThroughOptions.includes(desThrough)) {
      const newDes = [...localDesThroughs, desThrough]
      setLocalDesThroughs(newDes)
      localStorage.setItem('dc_manual_des_throughs', JSON.stringify(newDes))
    }
  }

  const generateChallanPDF = async (payload) => {
    try {
      // Fetch logo as base64
      let logoBase64 = null
      try {
        const response = await fetch('/logo.png')
        if (response.ok) {
          const blob = await response.blob()
          logoBase64 = await new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => resolve(reader.result)
            reader.readAsDataURL(blob)
          })
        }
      } catch (err) {
        console.error('Failed to load logo:', err)
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 14
      const contentW = pageW - margin * 2
      let y = 15

      // ── Colors ──
      const teal = [0, 151, 167]
      const dark = [30, 41, 59]
      const grey = [100, 116, 139]
      const lightBg = [248, 250, 252]
      const white = [255, 255, 255]
      const borderColor = [203, 213, 225]

      // ── Helper: draw a bordered box ──
      const drawBox = (x, yPos, w, h, fill = null) => {
        if (fill) doc.setFillColor(...fill)
        doc.setDrawColor(...borderColor)
        doc.setLineWidth(0.3)
        if (fill) doc.rect(x, yPos, w, h, 'FD')
        else doc.rect(x, yPos, w, h, 'S')
      }

      // ── OUTER BORDER ──
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.5)
      doc.rect(margin - 2, 10, contentW + 4, 270, 'S')

      // ══════════════════════════════════════════
      // SECTION 1: COMPANY HEADER (right-aligned title)
      // ══════════════════════════════════════════
      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('DELIVERY CHALLAN', pageW - margin, y + 2, { align: 'right' })

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grey)
      doc.text(`Delivery Challan# - ${payload.dcNo}`, pageW - margin, y + 8, { align: 'right' })

      y += 16

      // Company Info (left side)
      if (logoBase64) {
        // Draw logo: x, y, width, height
        try {
          doc.addImage(logoBase64, 'PNG', margin, y - 4, 12, 12)
        } catch (logoErr) {
          console.error('Failed to add logo to PDF:', logoErr)
        }

        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...dark)
        doc.text('Velson', margin + 15, y - 1)

        y += 4
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...grey)
        const companyAddress = 'SF NO 98/3A, Velson valley Nagichettypatti, Sankari, Tamil Nadu 637302'
        doc.text(companyAddress, margin + 15, y)

        y += 4
        doc.text(`GSTIN: ${payload.gstNo || 'N/A'}`, margin + 15, y)

        y += 4
        doc.text(`Phone: ${payload.contactNo || 'N/A'}`, margin + 15, y)
      } else {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...dark)
        doc.text('Welson India', margin, y)

        y += 5
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...grey)
        const companyAddress = 'SF NO 98/3A, Velson valley Nagichettypatti, Sankari, Tamil Nadu 637302'
        doc.text(companyAddress, margin, y)

        y += 4
        doc.text(`GSTIN: ${payload.gstNo || 'N/A'}`, margin, y)

        y += 4
        doc.text(`Phone: ${payload.contactNo || 'N/A'}`, margin, y)
      }

      y += 8

      // ── Separator ──
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 5

      // ══════════════════════════════════════════
      // SECTION 2: DC & ORDER DETAILS ROW
      // ══════════════════════════════════════════
      const dcDate = payload.date ? new Date(payload.date).toLocaleDateString('en-IN') : 'N/A'

      // Row with 2 columns: DC#, Order Date
      const col2W = contentW / 2

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('Delivery Challan #', margin, y)
      doc.text('Order Date #', margin + col2W, y)
      y += 4
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.text(payload.dcNo || 'N/A', margin, y)
      doc.text(dcDate, margin + col2W, y)

      y += 8
      doc.setDrawColor(...borderColor)
      doc.line(margin, y, pageW - margin, y)
      y += 5

      // ══════════════════════════════════════════
      // SECTION 3: BILL TO & CHALLAN DETAILS
      // ══════════════════════════════════════════
      const halfW = contentW / 2

      // Left column: Bill To
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('Bill To:', margin, y)

      // Right column: Challan details
      const rightX = margin + halfW + 10
      doc.text('Challan Date #', rightX, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.text(dcDate, rightX + 40, y)

      y += 5
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...dark)
      doc.text(payload.customerName || 'N/A', margin, y)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('Ref #', rightX, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.text(payload.dcNo || 'N/A', rightX + 40, y)

      y += 5
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grey)
      const billAddr = payload.address || 'N/A'
      const addrLines = doc.splitTextToSize(billAddr, halfW - 5)
      doc.text(addrLines, margin, y)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('Challan Type:', rightX, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.text(payload.dcType, rightX + 40, y)

      y += 5
      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('GSTIN:', rightX, y)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...dark)
      doc.setFontSize(9)
      doc.text(payload.gstNo || 'N/A', rightX + 40, y)

      y += 5
      doc.setTextColor(...grey)
      doc.setFontSize(9)
      doc.text(`Phone: ${payload.contactNo || 'N/A'}`, margin, y)

      y += 5
      doc.text(`Vehicle No: ${payload.vehicleNo || 'N/A'}`, margin, y)
      doc.text(`Driver: ${payload.driverName || 'N/A'}`, rightX, y)

      y += 5
      doc.text(`Dispatch Through: ${payload.desThrough || 'N/A'}`, margin, y)
      doc.text(`Contact Person: ${payload.contPerson || 'N/A'}`, rightX, y)

      y += 8
      doc.setDrawColor(...borderColor)
      doc.line(margin, y, pageW - margin, y)
      y += 3

      // ══════════════════════════════════════════
      // SECTION 4: ITEMS TABLE
      // ══════════════════════════════════════════
      const tableHeaders = [
        ['ITEM DESCRIPTION', 'PART NO', 'QTY', 'UOM', 'PRICE/ITEM', 'AMOUNT']
      ]

      const tableItems = payload.items || []
      let subTotal = 0
      const tableBody = tableItems.map((item, idx) => {
        const taxableValue = (item.qty * item.rate) || 0
        subTotal += taxableValue
        return [
          item.partName ? `${item.partName}${item.workType ? ` (${item.workType})` : ''}` : '-',
          item.partNo || '-',
          item.qty,
          item.uom,
          item.rate?.toFixed?.(2) || '0.00',
          taxableValue.toFixed(2)
        ]
      })

      // Add empty rows to match the Excel template (minimum 5 rows visible)
      const emptyRowsNeeded = Math.max(0, 5 - tableBody.length)
      for (let i = 0; i < emptyRowsNeeded; i++) {
        tableBody.push(['', '', '', '', '', ''])
      }

      autoTable(doc, {
        startY: y,
        head: tableHeaders,
        body: tableBody,
        theme: 'grid',
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          lineColor: borderColor,
          lineWidth: 0.3,
          textColor: dark,
          valign: 'middle',
          halign: 'center'
        },
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: white,
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 55, halign: 'left' },
          1: { cellWidth: 38, halign: 'left' },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 28 },
          5: { cellWidth: 30 }
        },
        alternateRowStyles: {
          fillColor: lightBg
        }
      })

      y = doc.lastAutoTable.finalY + 5

      // ══════════════════════════════════════════
      // SECTION 5: TOTALS SUMMARY
      // ══════════════════════════════════════════
      const grandTotal = subTotal

      const summaryX = pageW - margin - 70
      const valX = pageW - margin - 5

      const drawSummaryRow = (label, value, bold = false) => {
        doc.setFontSize(9)
        doc.setFont('helvetica', bold ? 'bold' : 'normal')
        doc.setTextColor(...(bold ? teal : dark))
        doc.text(label, summaryX, y, { align: 'left' })
        doc.text(value, valX, y, { align: 'right' })
        y += 5
      }

      drawSummaryRow('Sub Total:', subTotal.toFixed(2))

      // Grand Total with background
      drawBox(summaryX - 3, y - 4, 73, 7, [0, 151, 167])
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(...white)
      doc.text('Grand Total:', summaryX, y)
      doc.text(`Rs. ${grandTotal.toFixed(2)}`, valX, y, { align: 'right' })
      y += 10

      // ══════════════════════════════════════════
      // SECTION 6: TERMS & NOTES
      // ══════════════════════════════════════════
      doc.setDrawColor(...borderColor)
      doc.line(margin, y, pageW - margin, y)
      y += 5

      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...teal)
      doc.text('Notes:', margin, y)
      y += 5
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grey)
      doc.setFontSize(8)
      const terms = payload.termsOfDelivery || 'Goods delivered as per challan. Please acknowledge receipt.'
      const termsLines = doc.splitTextToSize(terms, contentW)
      doc.text(termsLines, margin, y)

      y += termsLines.length * 4 + 10

      // ══════════════════════════════════════════
      // SECTION 7: SIGNATURE BLOCKS
      // ══════════════════════════════════════════
      const sigY = Math.max(y, 250)
      doc.setDrawColor(...borderColor)
      doc.setLineWidth(0.3)

      // Left: Prepared By
      doc.line(margin, sigY, margin + 55, sigY)
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grey)
      doc.text('Prepared By', margin + 12, sigY + 4)

      // Center: Authorised Signatory
      const centerSigX = pageW / 2 - 27
      doc.line(centerSigX, sigY, centerSigX + 55, sigY)
      doc.text('Authorised Signatory', centerSigX + 5, sigY + 4)

      // Right: Received By
      doc.line(pageW - margin - 55, sigY, pageW - margin, sigY)
      doc.text("Receiver's Signature", pageW - margin - 50, sigY + 4)

      // ── Footer ──
      doc.setFontSize(7)
      doc.setTextColor(...grey)
      doc.text('This is a computer-generated document.', pageW / 2, 285, { align: 'center' })

      doc.save(`DC_${payload.dcNo}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      toast.error(`Failed to generate PDF: ${err.message}`)
    }
  }

  // Submit complete DC Entry
  const handleSubmit = async (generatePdf = false) => {
    if (!customerName) {
      toast.error('Customer Name is required')
      return
    }
    if (!dcType) {
      toast.error('DC Type is required')
      return
    }

    let finalItems = items.map((item, idx) => ({
      slNo: idx + 1,
      barcode: !item.barcode || item.barcode === 'N/A' ? null : item.barcode,
      partNo: item.partNo,
      partName: item.partName || '',
      spec: item.spec || null,
      brand: item.brand || null,
      qty: parseFloat(item.qty) || 0,
      uom: item.uom || null,
      rate: parseFloat(item.rate) || 0,
      amount: parseFloat(item.amount) || 0,
      heatTreatment: item.heatTreatment || null,
      mGrade: item.mGrade || null,
      rework: item.rework || null,
      hrc: item.hrc || null,
      weight: item.weight || null,
      details: item.details || null,
      workType: item.workType || null,
      availableStock: parseFloat(item.availableStock) || 0,
      source: item.source || null,
      sourceId: item.sourceId || null
    }))

    if (finalItems.length === 0) {
      if (!partNo) {
        toast.warning('Please add at least one item to the list')
        return
      }
      const numQty = parseFloat(qty)
      if (isNaN(numQty) || numQty <= 0) {
        toast.warning('Quantity must be greater than 0')
        return
      }
      if (barcode && barcode !== 'N/A') {
        if (numQty > availableStock) {
          toast.warning(`Quantity (${numQty}) cannot exceed available stock (${availableStock}) for barcode ${barcode}`)
          return
        }
      }
      const numericRate = parseFloat(rate) || 0
      finalItems = [{
        slNo: 1,
        barcode: !barcode || barcode === 'N/A' ? null : barcode,
        partNo,
        partName,
        spec: spec || null,
        brand: brand || null,
        qty: numQty,
        uom,
        rate: numericRate,
        amount: parseFloat(amount) || (numQty * numericRate),
        heatTreatment: heatTreatment || null,
        mGrade: mGrade || null,
        rework: rework || null,
        hrc: hrc || null,
        weight: weight || null,
        details: details || null,
        workType: workType || null,
        availableStock: parseFloat(availableStock) || 0,
        source: selectedBarcodeObj?.source || null,
        sourceId: selectedBarcodeObj?.id || null
      }]
    }


    setSubmitting(true)
    try {
      saveManualEntries()

      const payload = {
        dcNo,
        date: new Date(date).toISOString(),
        partyType: selectedParty ? selectedParty.type : 'Customer',
        customerId: selectedParty && selectedParty.type === 'Customer' ? selectedParty.id : null,
        supplierId: selectedParty && selectedParty.type === 'Supplier' ? selectedParty.id : null,
        customerName: customerName,
        address: customerDetails,
        contPerson,
        contactNo,
        gstNo,
        dcType,
        vehicleNo,
        driverName,
        desThrough,
        termsOfDelivery,
        items: finalItems
      }

      await api.post('/api/delivery-challan', payload, { loadingMessage: 'Submitting Delivery Challan...' })
      toast.success(`Delivery Challan ${dcNo} submitted successfully!`)
      await fetchRecentValues()

      if (generatePdf === true) {
        await generateChallanPDF(payload)
      }

      handleClearAll()
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Failed to submit Delivery Challan')
    } finally {
      setSubmitting(false)
    }
  }

  // Summary statistics — show current form entry values
  const totalQty = useMemo(() => {
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0)
    }
    const num = parseFloat(qty)
    return isNaN(num) ? 0 : num
  }, [items, qty])

  const totalAmount = useMemo(() => {
    if (items.length > 0) {
      return items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
    }
    const num = parseFloat(amount)
    return isNaN(num) ? 0 : num
  }, [items, amount])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0097A7]" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-46px)] w-full flex flex-col overflow-hidden bg-slate-50 text-slate-800">

      {/* Hidden file input for preview */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. Static Top Header Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">DC</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-[12px] text-[#0097a7] font-bold text-slate-600 uppercase tracking-wide">DC Entry</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => toast.success('Exporting items list to Excel...')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold rounded text-[12px] transition-colors shadow-sm"
          >
            <FileSpreadsheet size={14} /> Excel
          </button>
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('velson:navigate', { detail: 'Dashboard' }))}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 font-bold rounded text-[12px] transition-colors shadow-sm"
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>

      {/* 2. Scrollable Middle Content Container */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">

        {/* Card 1: Customer & Logistics Info */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm relative z-10">
          <div className="bg-[--color-main] text-white px-5 py-3 flex items-center justify-between font-semibold text-[13.5px] uppercase tracking-wider rounded-t-xl">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-3.5 bg-white rounded-sm opacity-90" />
              <span>Create - DC Entry</span>
            </div>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/10">
            {/* Column 1 */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Label required className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">DC No :</Label>
                <Input value={dcNo} onChange={e => setDcNo(e.target.value)} placeholder="DC Number" readOnly className="font-bold !text-[#0097A7] bg-slate-100 flex-1" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Date :</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="flex-1" readOnly />
              </div>
              <div className="flex items-center relative gap-2 z-[10000]">
                <Label required className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Party Name:</Label>
                <Combobox
                  options={partyNames}
                  placeholder="Select Party"
                  value={customerName}
                  onChange={handleCustomerChange}
                  className="flex-1"
                />
              </div>
              <div className="flex items-start gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left pt-1.5">Address :</Label>
                <TextArea
                  value={customerDetails}
                  onChange={e => setCustomerDetails(e.target.value)}
                  placeholder="Select Party to Autofill"
                  rows={3}
                  className="flex-1 cursor-not-allowed"
                  readOnly={true}

                />
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2">
                <Label required className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">DC Type :</Label>
                <Select
                  options={['Returnable', 'Non-Returnable']}
                  placeholder=""
                  value={dcType}
                  onChange={e => setDcType(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Cont.Person :</Label>
                <Input value={contPerson} onChange={e => setContPerson(e.target.value)} placeholder="Select Party to Autofill" className="flex-1" readOnly />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Contact No :</Label>
                <Input value={contactNo} onChange={e => setContactNo(e.target.value)} placeholder="Select Party to Autofill" className="flex-1" readOnly />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">GST No :</Label>
                <Input value={gstNo} onChange={e => setGstNo(e.target.value)} placeholder="Select Party to Autofill" className="flex-1" readOnly />
              </div>
              <div className="flex items-center gap-2">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Work Type :</Label>
                <Select
                  options={workTypes}
                  value={workType}
                  onChange={e => setWorkType(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Column 3 */}
            <div className="space-y-3.5">
              <div className="flex items-center relative gap-2 focus-within:z-[10000]">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Vehicle No :</Label>
                <Combobox
                  options={vehicleNumbers}
                  placeholder="Select or Type Vehicle"
                  value={vehicleNo}
                  onChange={val => setVehicleNo(val)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center relative gap-2 focus-within:z-[10000]">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Driver Name :</Label>
                <Combobox
                  options={driverNames}
                  placeholder="Select or Type Driver"
                  value={driverName}
                  onChange={val => setDriverName(val)}
                  className="flex-1"
                />
              </div>
              <div className="flex items-center relative gap-2 focus-within:z-[10000]">
                <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-left">Des.Through :</Label>
                <Combobox
                  options={desThroughOptions}
                  placeholder="Select or Type"
                  value={desThrough}
                  onChange={val => setDesThrough(val)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Item Details Form & Stock/Image Panel */}
        <div className="grid grid-cols-12 gap-5 items-start">

          {/* Left Card: Input fields */}
          <div className="col-span-12 lg:col-span-9 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-3.5 bg-[#0097A7] rounded-sm" />
                  <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">Item Despatch Details</h3>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {/* Barcode Type display as read-only badge */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Barcode Type:</span>
                    <span className="text-[14px] font-black uppercase text-[#0097A7]">{barcodeType}</span>
                  </div>
                  {/* Available Stock display as read-only badge */}
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Avail. Stock:</span>
                    <span className={`text-[14px] font-black tabular-nums ${availableStock > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>{availableStock}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearItemFields}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 text-slate-600 text-[11px] font-bold rounded shadow-sm transition-all border border-slate-200"
                  >
                    <RotateCcw size={13} /> Clear
                  </button>
                </div>
              </div>

              {/* All fields in 3-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
                {/* Barcode */}
                <div className="flex items-center relative gap-2 focus-within:z-[10000]">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Barcode :</Label>
                  <Combobox
                    options={barcodeList.map(b => b.barcode)}
                    placeholder="Select or Type Barcode"
                    value={barcode}
                    onChange={handleBarcodeChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        handleBarcodeSearch()
                      }
                    }}
                    className="flex-1"
                  />
                </div>

                {/* Part No */}
                <div className="flex items-center relative gap-2 focus-within:z-[10000]">
                  <Label required className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Part No :</Label>
                  <Combobox
                    options={partNumbers}
                    placeholder="Select Part No"
                    value={partNo}
                    onChange={handlePartNoChange}
                    className="flex-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Part Name :</Label>
                  <Input value={partName} readOnly placeholder="Auto-populated" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Spec :</Label>
                  <Input value={spec} readOnly placeholder="Auto-populated" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Brand :</Label>
                  <Input value={brand} readOnly placeholder="Auto-populated" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">UOM :</Label>
                  <Input value={uom} onChange={e => setUom(e.target.value)} placeholder="UOM" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label required className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Qty :</Label>
                  <Input value={qty} onChange={e => handleQtyChange(e.target.value)} type="number" placeholder="Enter Qty" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Rate :</Label>
                  <Input value={rate} onChange={e => handleRateChange(e.target.value)} type="number" placeholder="Enter Rate" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Amount :</Label>
                  <Input value={amount} readOnly placeholder="Auto" className="flex-1 !bg-slate-100 font-bold text-slate-800" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Heat Treat :</Label>
                  <Input value={heatTreatment} onChange={e => setHeatTreatment(e.target.value)} placeholder="Heat Treatment" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">M.Grade :</Label>
                  <Input value={mGrade} onChange={e => setMGrade(e.target.value)} placeholder="Material Grade" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Rework :</Label>
                  <Select options={['NO', 'YES']} value={rework} onChange={e => setRework(e.target.value)} className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">HRC :</Label>
                  <Input value={hrc} onChange={e => setHrc(e.target.value)} placeholder="HRC" className="flex-1" />
                </div>

                <div className="flex items-center gap-2">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Weight :</Label>
                  <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="Weight" className="flex-1" />
                </div>





                <div className="flex items-center gap-2 col-span-1 md:col-span-2 lg:col-span-3">
                  <Label className="w-[100px] shrink-0 text-slate-600 font-semibold text-left">Details :</Label>
                  <Input value={details} onChange={e => setDetails(e.target.value)} placeholder="Additional details" className="flex-1" />
                </div>
              </div>

              {/* Add Row Button */}
              <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleSaveItem}
                  className="px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white font-bold rounded text-[13px] transition-all active:scale-95 shadow-sm flex items-center gap-2"
                >
                  <Plus size={16} /> Add Row / Item
                </button>
              </div>
            </div>
          </div>

          {/* Right Card: Image preview & Stock details */}
          <div className="col-span-12 lg:col-span-3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-items-end space-y-4 min-h-[320px]">
            <div className="grid grid-cols-1 gap-4 flex-grow">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Part Image</span>
                <div className="w-full h-[220px] mt-5 border border-slate-200 bg-slate-50 rounded-lg flex items-center justify-center overflow-hidden shadow-inner relative group">
                  {displayImage ? (
                    <img src={displayImage} alt="Preview" className="h-full w-full object-contain rounded" />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <Camera size={26} className="opacity-30 text-slate-400" />
                      <span className="text-[9px] uppercase font-bold text-slate-400 mt-1">No Image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* Added Items Table Card */}
        {items.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet size={16} className="text-[#0097A7]" />
                Added Items List ({items.length})
              </h3>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left border-collapse min-w-[1400px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[50px] text-center">Sl</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[120px]">Barcode</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[120px]">Part No</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[150px]">Part Name</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[100px]">Spec</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[100px]">Brand</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[70px] text-center">UOM</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[80px] text-right">Qty</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[90px] text-right">Rate</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[100px] text-right">Amount</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[100px]">Heat Treat</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[110px]">M.Grade</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[80px] text-center">Rework</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[80px] text-center">HRC</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[80px] text-center">Weight</th>
                      <th className="px-3 py-2.5 border-r border-slate-200 w-[120px]">Work Type</th>
                      <th className="px-3 py-2.5 border-r border-slate-200">Details</th>
                      <th className="px-3 py-2.5 text-center w-[70px]">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-700 text-[12px]">
                    {items.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-semibold text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-2 border-r border-slate-200 font-mono text-[11.5px]">{item.barcode || 'N/A'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 font-semibold">{item.partNo}</td>
                        <td className="px-3 py-2 border-r border-slate-200 truncate max-w-[150px]" title={item.partName}>{item.partName || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 truncate max-w-[100px]" title={item.spec}>{item.spec || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 truncate max-w-[100px]" title={item.brand}>{item.brand || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center font-bold text-slate-500">{item.uom || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-blue-600">{parseFloat(item.qty).toFixed(2)}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-medium text-slate-600">{parseFloat(item.rate).toFixed(2)}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-right font-bold text-emerald-600">{parseFloat(item.amount).toFixed(2)}</td>
                        <td className="px-3 py-2 border-r border-slate-200">{item.heatTreatment || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200">{item.mGrade || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.rework === 'YES' ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                            {item.rework}
                          </span>
                        </td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center">{item.hrc || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 text-center">{item.weight || '—'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 font-semibold text-[#0097A7]">{item.workType || 'Heat Treatment'}</td>
                        <td className="px-3 py-2 border-r border-slate-200 truncate max-w-[200px]" title={item.details}>{item.details || '—'}</td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors active:scale-95"
                            title="Remove Item"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Terms of Delivery Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <Label className="w-[110px] shrink-0 text-slate-600 font-semibold text-[12px] pt-1">Terms of Delivery :</Label>
            <TextArea
              value={termsOfDelivery}
              onChange={e => setTermsOfDelivery(e.target.value)}
              placeholder="Specify terms of despatch/delivery instructions"
              rows={2}
              className="flex-grow"
            />
          </div>
        </div>

      </div>

      {/* 3. Fixed Bottom Action Bar */}
      <div className="bg-white border-t border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-[0_-3px_12px_rgba(0,0,0,0.04)] z-10">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded text-[13px] transition-colors active:scale-95 shadow-sm flex items-center gap-2"
          >
            <X size={15} /> Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded text-[13px] shadow disabled:opacity-60 transition-colors active:scale-95"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <FileText size={15} />}
            Save & PDF
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="flex items-center justify-center gap-2 px-6 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white font-bold rounded text-[13px] shadow disabled:opacity-60 transition-colors active:scale-95"
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={15} />}
            Submit
          </button>
        </div>

        <div className="flex gap-8 text-[13px] font-bold text-slate-600 uppercase bg-slate-50 px-6 py-2 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2">
            <span>Total Qty:</span>
            <span className="text-blue-600 font-black text-[15px] tabular-nums">{totalQty.toFixed(2)}</span>
          </div>
          <div className="border-l border-slate-200 pl-8 flex items-center gap-2">
            <span>Total Amount:</span>
            <span className="text-emerald-600 font-black text-[15px] tabular-nums">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}