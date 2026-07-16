/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useRef } from 'react'
import { ChevronRight, X, Plus, Image as ImageIcon, Search, RotateCcw, FileSpreadsheet } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useCustomers, useVehicles, useServiceBookings, useItemGroups, useBoms } from '../hooks/useMasterData'
import ItemSearchInput from '../components/ItemSearchInput'
import AuthenticatedImage from '../components/AuthenticatedImage'
import ExcelJS from 'exceljs'
import { useLoading } from '../context/LoadingContext'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider">
    {required && <span className="text-red-500 mr-0.5">*</span>}
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', readOnly = false, className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    readOnly={readOnly}
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed' : 'hover:border-slate-300'} ${className}`}
  />
)

const Select = ({ options, placeholder, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 cursor-pointer"
    >
      <option value="">{placeholder}</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const SearchableSelect = ({ options = [], placeholder = 'Search...', value, onChange, className = '' }) => {
  const [query, setQuery] = useState(value || '')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filtered = options
    .filter(o => o && o.toLowerCase().includes((query || '').toLowerCase()))
    .slice(0, 60)

  return (
    <div ref={ref} className="relative w-full">
      <div className="relative">
        <input
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            onChange(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className={`w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
          autoComplete="off"
        />
        <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full min-w-[180px] bg-white border border-slate-200 rounded-lg shadow-lg max-h-52 overflow-y-auto mt-1">
          {filtered.map(opt => (
            <div
              key={opt}
              onMouseDown={() => {
                onChange(opt)
                setQuery(opt)
                setOpen(false)
              }}
              className={`px-3 py-2 text-xs cursor-pointer transition-colors ${opt === value
                ? 'bg-[#0097A7] text-white font-semibold'
                : 'hover:bg-[#0097A7]/10 text-slate-700'
                }`}
            >
              {opt}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BOMCreation() {
  const toast = useToast()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    bomNo: '',
    customerName: '',
    customerCode: '',
    vehicleCount: '',
    serviceJobNo: '',
    vehicleSerialNo: '',
    model: '',
    fileLocation: '',
    fileName: '',
    groupName: '',
    assemblyPartNo: ''
  })

  const { show: showLoader, hide: hideLoader } = useLoading()
  const [createdRecords, setCreatedRecords] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [excelData, setExcelData] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [skippedRecords, setSkippedRecords] = useState([])
  const [hoverImage, setHoverImage] = useState(null) // { src, x, y }

  // React Query master data fetches
  const { data: custsRes = [] } = useCustomers()
  const { data: vehsRes = [] } = useVehicles()
  const { data: bookingsRes = [] } = useServiceBookings()
  const { data: groupRes = [] } = useItemGroups()
  const { data: bomsRes = [], refetch: refetchBoms } = useBoms()

  const customers = custsRes
  const vehicles = vehsRes
  const bookings = bookingsRes
  const itemGroups = groupRes
  const [selectedPart, setSelectedPart] = useState(null)
  // Helper to compute next BOM No based on sequence
  const getNextBOMNo = (records) => {
    const bomNumbers = records
      .map(r => {
        if (!r.bomNo) return null
        const match = r.bomNo.match(/\d+$/)
        return match ? parseInt(match[0], 10) : null
      })
      .filter(num => num !== null && !isNaN(num))
    const max = bomNumbers.length > 0 ? Math.max(...bomNumbers) : 0
    return `BOM-${max + 1}`
  }

  useEffect(() => {
    if (bomsRes) {
      setCreatedRecords(bomsRes)
      setForm(f => ({ ...f, bomNo: getNextBOMNo(bomsRes) }))
    }
  }, [bomsRes])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleGroupNameChange = (groupNameVal) => {
    setForm(f => ({
      ...f,
      groupName: groupNameVal,
      assemblyPartNo: ''
    }))
  }

  const handleCustomerChange = (customerNameVal) => {
    const cust = customers.find(c => c.customerName === customerNameVal)
    if (!cust) {
      setForm(f => ({
        ...f,
        customerName: customerNameVal,
        customerCode: '',
        vehicleCount: '',
        vehicleSerialNo: '',
        model: ''
      }))
      return
    }
    const customerVehicles = vehicles.filter(v => 
      Number(v.customerId) === Number(cust.id) &&
      bookings.some(b => (b.vehicleSerialNo === v.serialNumber || b.serialNo === v.serialNumber) && b.tempStatus === 'Open')
    )
    setForm(f => ({
      ...f,
      customerName: customerNameVal,
      customerCode: cust.cCode || '',
      vehicleCount: customerVehicles.length
    }))
  }

  const handleVehicleSelect = (vehicleIndexStr) => {
    if (!vehicleIndexStr) {
      setForm(f => ({ ...f, vehicleSerialNo: '', model: '', serviceJobNo: '' }))
      return
    }
    const idx = parseInt(vehicleIndexStr, 10) - 1
    const vehicle = customerVehicles[idx]
    if (vehicle) {
      const matchingBooking = bookings.find(b => 
        (b.vehicleSerialNo === vehicle.serialNumber || b.serialNo === vehicle.serialNumber) && 
        b.tempStatus === 'Open'
      )
      setForm(f => ({
        ...f,
        vehicleSerialNo: vehicle.serialNumber || '',
        model: vehicle.modelName || '',
        serviceJobNo: matchingBooking ? matchingBooking.serviceJobNo : ''
      }))
    }
  }

  const handleServiceJobNoSelect = (serviceJobNoVal) => {
    const booking = bookings.find(b => b.serviceJobNo === serviceJobNoVal)
    if (booking) {
      setForm(f => ({
        ...f,
        serviceJobNo: serviceJobNoVal,
        customerName: booking.customerName || '',
        customerCode: booking.customerCode || '',
        vehicleSerialNo: booking.vehicleSerialNo || booking.serialNo || '',
        model: booking.vehicleModelNo || '',
        vehicleCount: booking.customerVehicleCount || ''
      }))
    } else {
      setForm(f => ({ ...f, serviceJobNo: serviceJobNoVal }))
    }
  }

  const handleCreate = async () => {
    if (!form.customerName) {
      toast.warning('Please fill required fields (Customer Name).')
      return
    }
    if (!form.serviceJobNo) {
      toast.warning('Please fill required fields (Service Job No).')
      return
    }
    if (excelData.length > 0 && selectedRows.length === 0) {
      toast.warning('Please select at least one row from the parsed Excel data.')
      return
    }
    setIsCreating(true)
    try {
      const payload = {
        ...form,
        excelRows: excelData.filter((_, idx) => selectedRows.includes(idx))
      }
      const res = await api.post('/api/bom-creation', payload)
      if (res.data?.success) {
        const savedRecord = res.data.data
        const updated = [savedRecord, ...createdRecords]
        setCreatedRecords(updated)
        refetchBoms()
        toast.success('BOM Uploaded & Saved Successfully!')
        handleClear(updated)
      } else {
        toast.error(res.data?.message || 'Error saving BOM record.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error saving BOM to database. ' + (err.response?.data?.message || err.message))
    } finally {
      setIsCreating(false)
    }
  }

  const handleClear = (customRecords) => {
    const records = customRecords && Array.isArray(customRecords) ? customRecords : createdRecords
    setForm({
      date: new Date().toISOString().split('T')[0],
      bomNo: getNextBOMNo(records),
      customerName: '',
      customerCode: '',
      vehicleCount: '',
      serviceJobNo: '',
      vehicleSerialNo: '',
      model: '',
      fileLocation: '',
      fileName: '',
      groupName: '',
      assemblyPartNo: ''
    })
    setExcelData([])
    setSelectedRows([])
    setSkippedRecords([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle browse & file parsing
  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setForm(f => ({
      ...f,
      fileName: file.name,
      fileLocation: file.webkitRelativePath || file.name
    }))

    showLoader('Processing Excel file...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)

        const worksheet = workbook.worksheets[0]
        if (!worksheet) {
          toast.warning('The selected Excel file is empty.')
          hideLoader()
          return
        }

        // Parse headers from the first row
        const headers = []
        const headerRow = worksheet.getRow(1)
        headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          headers[colNumber] = cell.value ? String(cell.value).trim() : `Column ${colNumber}`
        })

        // Map rows to JSON objects (keep raw structure for image mapping first)
        const parsedRows = []
        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
          if (rowNumber === 1) return // Skip header row

          const rowData = {}
          // Initialize columns with empty values
          headers.forEach((header, index) => {
            if (index > 0) {
              const cell = row.getCell(index)
              rowData[header] = cell.value !== null && cell.value !== undefined ? String(cell.value) : ''
            }
          })
          parsedRows.push({ rowNumber, data: rowData })
        })

        // Map embedded images to their target cell row/col indexes
        const images = worksheet.getImages() || []
        images.forEach((imgObj) => {
          const image = workbook.model.media.find(m => m.index === imgObj.imageId)
          if (!image) return

          // Convert buffer to displayable base64
          const base64Data = image.buffer.toString('base64')
          const mimeType = image.type === 'png' ? 'image/png' : 'image/jpeg'
          const imgSrc = `data:${mimeType};base64,${base64Data}`

          // range coordinates: tl (top-left) col and row
          const tl = imgObj.range.tl
          const rowIdx = Math.floor(tl.row) - 1 // header is row 0 in parsedRows index
          const colIdx = Math.floor(tl.col) + 1 // excel columns are 1-indexed

          if (parsedRows[rowIdx]) {
            const headerName = headers[colIdx]
            if (headerName) {
              parsedRows[rowIdx].data[headerName] = imgSrc
            }
          }
        })

        // Find headers for Part No and Part Name
        const partNoHeader = headers.find(h => {
          if (!h) return false
          const l = h.toLowerCase()
          return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno'
        })

        const partNameHeader = headers.find(h => {
          if (!h) return false
          const l = h.toLowerCase()
          return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description')
        })

        const validRows = []
        const skipped = []
        for (const rowObj of parsedRows) {
          const row = rowObj.data
          const rowNum = rowObj.rowNumber
          const partNoVal = partNoHeader ? String(row[partNoHeader] || '').trim() : ''

          const imgVal = Object.values(row).find(val =>
            typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/') || val.startsWith('/api/'))
          ) || null

          if (!partNoVal) {
            skipped.push({
              row: rowNum,
              partNo: '—',
              partName: partNameHeader ? String(row[partNameHeader] || '').trim() : '—',
              image: imgVal,
              reason: 'Part Number is missing in Excel row'
            })
            continue
          }

          // Search in Item Master dynamically
          try {
            const res = await api.get(`/api/item-master?search=${encodeURIComponent(partNoVal)}&limit=1`, { skipGlobalLoader: true })
            const matchedItem = res.data?.data?.[0]
            const isExactMatch = matchedItem && String(matchedItem.partNo || '').trim().toLowerCase() === partNoVal.toLowerCase()

            if (!isExactMatch) {
              skipped.push({
                row: rowNum,
                partNo: partNoVal,
                partName: partNameHeader ? String(row[partNameHeader] || '').trim() : '—',
                image: imgVal,
                reason: 'Part Number not found in Item Master'
              })
              continue
            }

            // Fetch official Part Name from Item Master and override Excel spelling errors
            if (partNameHeader) {
              row[partNameHeader] = matchedItem.partName
            }

            validRows.push(row)
          } catch (err) {
            console.error('Failed to validate part no:', partNoVal, err)
            skipped.push({
              row: rowNum,
              partNo: partNoVal,
              partName: partNameHeader ? String(row[partNameHeader] || '').trim() : '—',
              image: imgVal,
              reason: 'Failed to query database for verification'
            })
          }
        }

        setSkippedRecords(skipped)

        if (validRows.length === 0) {
          toast.warning('No valid parts matching Item Master were found in the sheet.')
          setExcelData([])
          setSelectedRows([])
          hideLoader()
          return
        }

        setExcelData(validRows)
        setSelectedRows(validRows.map((_, idx) => idx))
        toast.success(`BOM file processed successfully! Loaded ${validRows.length} parts, skipped ${skipped.length} parts.`)
      } catch (err) {
        console.error(err)
        toast.error('Error reading Excel file.')
      } finally {
        hideLoader()
      }
    }
    reader.onerror = () => {
      toast.error('Error reading Excel file.')
      hideLoader()
    }
    reader.readAsArrayBuffer(file)
  }

  // Memoized options for select elements
  const customerVehicles = useMemo(() => {
    const custObj = customers.find(c => c.customerName === form.customerName)
    if (!custObj) return []
    return vehicles.filter(v => 
      Number(v.customerId) === Number(custObj.id) &&
      bookings.some(b => (b.vehicleSerialNo === v.serialNumber || b.serialNo === v.serialNumber) && b.tempStatus === 'Open')
    )
  }, [customers, vehicles, form.customerName, bookings])

  const vehicleOptions = useMemo(() => {
    const count = customerVehicles.length
    const opts = []
    for (let i = 1; i <= count; i++) {
      opts.push(String(i))
    }
    return opts
  }, [customerVehicles])

  const selectedVehicleLabel = useMemo(() => {
    if (!form.vehicleSerialNo) return ''
    const idx = customerVehicles.findIndex(v => v.serialNumber === form.vehicleSerialNo)
    return idx !== -1 ? String(idx + 1) : ''
  }, [customerVehicles, form.vehicleSerialNo])

  const bookingServiceJobNoOptions = useMemo(() => {
    return bookings.filter(b => b.tempStatus === 'Open').map(b => b.serviceJobNo).filter(Boolean)
  }, [bookings])

  const modelOptions = useMemo(() => {
    return Array.from(new Set(vehicles.map(v => v.modelName).filter(Boolean))).sort()
  }, [vehicles])

  const groupNameOptions = useMemo(() => {
    return Array.from(new Set(itemGroups.map(g => g.groupName).filter(Boolean))).sort()
  }, [itemGroups])

  const selectedPartImage = useMemo(() => {
    if (!form.assemblyPartNo) return null
    const item = selectedPart && selectedPart.partNo === form.assemblyPartNo ? selectedPart : null
    if (!item) return null

    // Check if back-end provides hasImage (derived property) or is direct database column check
    const hasImg = item.hasImage || !!item.imageMimeType
    if (hasImg) {
      return `/api/item-master/${item.id}/download-image`
    }

    if (item.imagePath) {
      if (item.imagePath.startsWith('http') || item.imagePath.startsWith('/')) {
        return item.imagePath
      }
      return `/uploads/${item.imagePath}`
    }
    return null
  }, [selectedPart, form.assemblyPartNo])

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(excelData.map((_, idx) => idx))
    } else {
      setSelectedRows([])
    }
  }

  const handleRowCheckboxChange = (idx, checked) => {
    if (checked) {
      setSelectedRows(prev => [...prev, idx])
    } else {
      setSelectedRows(prev => prev.filter(item => item !== idx))
    }
  }

  const handleCellEdit = (rowIdx, key, newVal) => {
    setExcelData(prev => prev.map((row, idx) => {
      if (idx === rowIdx) {
        return { ...row, [key]: newVal }
      }
      return row
    }))
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10 relative">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">BOM Creation</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">BOM Creation Interface</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-2">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: BOM Details */}
              <div className="col-span-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label required>Entry Date</Label>
                    <Input type="date" value={form.date} onChange={u('date')} />
                  </div>
                  <div>
                    <Label>BOM No</Label>
                    <Input value={form.bomNo} readOnly placeholder="Auto-generated" className="!font-bold !text-[#0097A7]" />
                  </div>
                </div>

                <div>
                  <Label required>Customer Name</Label>
                  <SearchableSelect
                    options={customers.map(c => c.customerName)}
                    value={form.customerName}
                    onChange={handleCustomerChange}
                    placeholder="Search Customer..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Customer Code</Label>
                    <Input value={form.customerCode} readOnly placeholder="Auto-populated" className='font-bold !text-[#0097A7]' />
                  </div>
                  <div>
                    <Label>Vehicle Count</Label>
                    <Input value={form.vehicleCount} onChange={u('vehicleCount')} type="number" placeholder="0" readOnly />
                  </div>
                  <div>
                    <Label>Choose Vehicle</Label>
                    <Select
                      options={vehicleOptions}
                      value={selectedVehicleLabel}
                      onChange={e => handleVehicleSelect(e.target.value)}
                      placeholder="Select..."
                    />
                  </div>
                </div>

                <div>
                  <Label required>Service Job No</Label>
                  <Select options={bookingServiceJobNoOptions} value={form.serviceJobNo} onChange={e => handleServiceJobNoSelect(e.target.value)} placeholder="Select Service Job No" />
                </div>

                <div>
                  <Label>Vehicle Serial No</Label>
                  <Input value={form.vehicleSerialNo} onChange={u('vehicleSerialNo')} placeholder="Enter Serial No..." />
                </div>

                <div>
                  <Label>Model</Label>
                  <Select options={modelOptions} value={form.model} onChange={u('model')} placeholder="Select Model..." />
                </div>
              </div>

              {/* Middle Column: File Upload */}
              <div className="col-span-4 space-y-4 border-l border-slate-100 pl-10">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 border-dashed">
                  <div className="space-y-4">
                    <div>
                      <Label>File Location</Label>
                      <Input value={form.fileLocation} readOnly placeholder="Upload via Browse..." />
                    </div>
                    <div>
                      <Label required>File Name</Label>
                      <Input value={form.fileName} readOnly placeholder="No file chosen" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Group Name</Label>
                  <Select options={groupNameOptions} value={form.groupName} onChange={e => handleGroupNameChange(e.target.value)} placeholder="Pick Group" />
                </div>
                <div>
                  <Label>Assembly Part No</Label>
                  <ItemSearchInput
                    value={form.assemblyPartNo}
                    onChange={(val, item) => {
                      if (item) {
                        const matchedGroup = itemGroups.find(g => Number(g.id) === Number(item.groupId))
                        setForm(f => ({
                          ...f,
                          assemblyPartNo: item.partNo,
                          groupName: matchedGroup ? matchedGroup.groupName : f.groupName
                        }))
                        setSelectedPart(item)
                      } else {
                        setForm(f => ({
                          ...f,
                          assemblyPartNo: val
                        }))
                        if (!val) setSelectedPart(null)
                      }
                    }}
                    displayField="partNo"
                    placeholder="Search Assembly Part No"
                    className="w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button onClick={handleBrowseClick} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[13px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                    <Search size={18} className="text-[#0097A7]" /> Browse
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="flex-1 flex-row flex items-center justify-center gap-2 px-6 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
                  >
                    {isCreating ? <RotateCcw size={18} className="animate-spin" /> : <Plus size={18} />}
                    {isCreating ? 'Uploading' : 'Upload'}
                  </button>
                </div>
              </div>

              {/* Right Column: Image Preview */}
              <div className="col-span-3 space-y-3">
                <Label>Model Visualization</Label>
                <div className="aspect-square w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 overflow-hidden relative">
                  {selectedPartImage ? (
                    <AuthenticatedImage
                      src={selectedPartImage}
                      alt="Assembly Preview"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center">
                      <ImageIcon size={64} strokeWidth={1} className="transition-transform text-slate-300" />
                      <p className="text-[10px] font-black mt-3 uppercase tracking-widest text-slate-400">No Preview Available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Excel Data Parsed Preview */}
            {excelData.length > 0 && (
              <div className="mt-10 border-t border-slate-200 pt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-emerald-600 pl-3">Parsed Excel Data Preview</h3>
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-500">
                    <span>Selected: {selectedRows.length} / {excelData.length} Rows</span>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-xl shadow-sm max-h-[620px] overflow-auto w-full">
                  <table className="w-full text-left border-collapse min-w-max">
                    <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                        <th className="px-5 py-3 border-r border-slate-200 w-16 text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                            checked={excelData.length > 0 && selectedRows.length === excelData.length}
                            onChange={handleSelectAll}
                          />
                        </th>
                        {Object.keys(excelData[0] || {}).map((header, idx) => (
                          <th key={idx} className="px-5 py-3 border-r border-slate-200">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {excelData.map((row, idx) => (
                        <tr key={idx} className={`hover:bg-slate-50 transition-colors ${selectedRows.includes(idx) ? 'bg-[#0097A7]/5' : ''}`}>
                          <td className="px-5 py-2.5 border-r border-slate-200 text-center">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-slate-300 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                              checked={selectedRows.includes(idx)}
                              onChange={(e) => handleRowCheckboxChange(idx, e.target.checked)}
                            />
                          </td>
                          {Object.entries(row).map(([key, val], colIdx) => {
                            const valStr = String(val).trim();
                            const isImg = valStr.startsWith('http://') ||
                              valStr.startsWith('https://') ||
                              valStr.startsWith('/api/') ||
                              valStr.startsWith('/uploads/') ||
                              valStr.startsWith('data:image/');
                            return (
                              <td
                                key={colIdx}
                                contentEditable={!isImg}
                                suppressContentEditableWarning
                                onBlur={(e) => handleCellEdit(idx, key, e.target.textContent)}
                                className="px-5 py-2.5 border-r border-slate-200 text-slate-700 text-sm outline-none focus:bg-slate-50"
                              >
                                {isImg ? (
                                  <img
                                    src={valStr}
                                    alt="Preview"
                                    className="max-h-12 max-w-[100px] object-contain rounded border border-slate-100 cursor-pointer animate-fade-in hover:scale-105 transition-transform"
                                    onMouseEnter={e => {
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setHoverImage({ src: valStr, x: rect.left + rect.width / 2, y: rect.top })
                                    }}
                                    onMouseLeave={() => setHoverImage(null)}
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                  />
                                ) : (
                                  valStr
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {skippedRecords.length > 0 && (
              <div className="mt-8 border border-rose-200 bg-rose-50/30 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2.5 h-4 bg-rose-500 rounded-full" />
                  <h4 className="text-[12px] font-black text-rose-700 uppercase tracking-widest">
                    Skipped Rows (Not found in Item Master: {skippedRecords.length})
                  </h4>
                </div>
                <div className="border border-rose-100 rounded-lg overflow-hidden max-h-[620px] overflow-y-auto">
                  <table className="w-full text-left border-collapse text-xs bg-white">
                    <thead className="bg-rose-50 text-[10px] uppercase text-rose-700 font-bold border-b border-rose-100 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 w-20 text-center">Row No</th>
                        <th className="px-4 py-2 w-24 text-center">Image</th>
                        <th className="px-4 py-2 w-48">Part Number</th>
                        <th className="px-4 py-2">Part Name / Description</th>
                        <th className="px-4 py-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-rose-50 text-slate-600">
                      {skippedRecords.map((r, i) => (
                        <tr key={i} className="hover:bg-rose-50/20">
                          <td className="px-4 py-2 text-center font-bold text-slate-400">{r.row}</td>
                          <td className="px-4 py-2 text-center">
                            {r.image ? (
                              <img
                                src={r.image}
                                alt="Part Preview"
                                className="max-h-12 max-w-[83px] object-contain rounded border border-rose-100 mx-auto cursor-pointer animate-fade-in hover:scale-105 transition-transform"
                                onMouseEnter={e => {
                                  const rect = e.currentTarget.getBoundingClientRect()
                                  setHoverImage({ src: r.image, x: rect.left + rect.width / 2, y: rect.top })
                                }}
                                onMouseLeave={() => setHoverImage(null)}
                                onError={(e) => { e.target.style.display = 'none'; }}
                              />
                            ) : (
                              <span className="text-slate-300 font-bold text-[10px]">No Image</span>
                            )}
                          </td>
                          <td className="px-4 py-2 font-mono font-bold text-rose-600">{r.partNo}</td>
                          <td className="px-4 py-2">{r.partName}</td>
                          <td className="px-4 py-2 text-rose-500 font-medium">{r.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Table Section */}
            {/* <div className="mt-12">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-[12px] font-black text-slate-800 uppercase tracking-widest border-l-4 border-[#0097A7] pl-3">Recent BOM Creations</h3>
                  <span className="bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded text-[10px] font-bold">{createdRecords.length} Items</span>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-5 py-4 border-r border-slate-200 w-16 text-center">S.No</th>
                      <th className="px-5 py-4 border-r border-slate-200">Customer</th>
                      <th className="px-5 py-4 border-r border-slate-200">BOM No</th>
                      <th className="px-5 py-4 border-r border-slate-200">Model</th>
                      <th className="px-5 py-4 border-r border-slate-200">File Name</th>
                      <th className="px-5 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {createdRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center text-slate-300 italic text-sm">
                          <FileText size={40} className="mx-auto mb-2 opacity-20" />
                          No BOM records created yet.
                        </td>
                      </tr>
                    ) : (
                      createdRecords.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50 transition-colors h-14">
                          <td className="px-5 py-2 border-r border-slate-200 text-center text-[12px] text-slate-400 font-bold">{idx + 1}</td>
                          <td className="px-5 py-2 border-r border-slate-200 font-black text-[13px] text-slate-700">{row.customerName}</td>
                          <td className="px-5 py-2 border-r border-slate-200 font-bold text-[12px] text-[#0097A7]">{row.bomNo}</td>
                          <td className="px-5 py-2 border-r border-slate-200 text-[13px]">{row.model}</td>
                          <td className="px-5 py-2 border-r border-slate-200 text-[12px] text-slate-500">{row.fileName}</td>
                          <td className="px-5 py-2 text-center">
                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Created</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div> */}
          </div>
        </div>
      </div>
      {/* Image hover preview — fixed so table overflow doesn't clip it */}
      {hoverImage && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: hoverImage.x, top: hoverImage.y - 10, transform: 'translate(-50%, -100%)' }}
        >
          <div className="bg-white rounded-xl shadow-2xl border-2 border-[#0097A7] p-2">
            <img src={hoverImage.src} alt="preview" className="w-64 h-44 object-contain rounded-lg" />
          </div>
          <div className="flex justify-center">
            <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-[#0097A7] rotate-45 -mt-1.5" />
          </div>
        </div>
      )}
    </div>
  )
}

