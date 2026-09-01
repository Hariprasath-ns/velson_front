/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */
import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, X, Plus, Image as ImageIcon, Search, RotateCcw, FileSpreadsheet } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useCustomers, useVehicles, useServiceBookings, useItemGroups, useBoms, useItemMaster } from '../hooks/useMasterData'
import ItemSearchInput from '../components/ItemSearchInput'
import AuthenticatedImage from '../components/AuthenticatedImage'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
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
  const queryClient = useQueryClient()
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
    modelNo: '',
    fileLocation: '',
    fileName: '',
    groupName: '',
    assemblyPartNo: ''
  })
  const [indexRecords, setIndexRecords] = useState([])

  const { show: showLoader, hide: hideLoader } = useLoading()
  const [createdRecords, setCreatedRecords] = useState([])
  const [isCreating, setIsCreating] = useState(false)
  const [excelData, setExcelData] = useState([])
  const [selectedRows, setSelectedRows] = useState([])
  const [skippedRecords, setSkippedRecords] = useState([])
  const [activePreviewRowIdx, setActivePreviewRowIdx] = useState(null)
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

  const [itemMaster, setItemMaster] = useState([])
  const [selectedPart, setSelectedPart] = useState(null)

  useEffect(() => {
    const fetchItemMaster = async () => {
      try {
        const res = await api.get('/api/item-master?limit=10000')
        setItemMaster(res.data?.data || [])
      } catch (err) {
        console.error('Failed to fetch item master list:', err)
      }
    }
    const fetchIndexRecords = async () => {
      try {
        const res = await api.get('/api/index-creation')
        setIndexRecords(res.data?.data || [])
      } catch (err) {
        console.error('Failed to fetch index records:', err)
      }
    }
    fetchItemMaster()
    fetchIndexRecords()
  }, [])
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
    setSelectedPart(null)
  }

  const assemblyPartNoOptions = useMemo(() => {
    if (form.groupName) {
      const selectedGroup = itemGroups.find(g => g.groupName && g.groupName.trim().toLowerCase() === form.groupName.trim().toLowerCase())
      if (selectedGroup) {
        const groupItems = itemMaster
          .filter(item => Number(item.groupId) === Number(selectedGroup.id))
          .map(item => item.partNo)
          .filter(Boolean)
        if (groupItems.length > 0) return groupItems.sort()
      }
    }
    const imParts = itemMaster.map(item => item.partNo).filter(Boolean)
    const idxModels = indexRecords.map(i => i.modelNo).filter(Boolean)
    return Array.from(new Set([...imParts, ...idxModels])).sort()
  }, [itemMaster, itemGroups, form.groupName, indexRecords])

  const modelNoOptions = useMemo(() => {
    let list = indexRecords
    if (form.model) {
      const filtered = list.filter(i => (i.model || '').toLowerCase() === form.model.toLowerCase())
      if (filtered.length > 0) {
        return Array.from(new Set(filtered.map(i => i.modelNo).filter(Boolean))).sort()
      }
    }
    return Array.from(new Set(list.map(i => i.modelNo).filter(Boolean))).sort()
  }, [indexRecords, form.model])

  const handleModelNoSelect = (modelNoVal) => {
    const matchedIndex = indexRecords.find(i => i.modelNo === modelNoVal)
    setForm(f => ({
      ...f,
      modelNo: modelNoVal,
      model: matchedIndex?.model || f.model,
      fileName: matchedIndex?.fileName || f.fileName,
      fileLocation: matchedIndex?.fileLocation || f.fileLocation,
    }))

    // Always load child components for the selected Model No from Index Creation
    if (matchedIndex) {
      const rawRows = matchedIndex.excelData
      const rows = Array.isArray(rawRows) ? rawRows : (rawRows?.excelData || [])
      if (rows && rows.length > 0) {
        setExcelData(rows)
        setSelectedRows(rows.map((_, idx) => idx))
        setActivePreviewRowIdx(0)
        if (rows[0]) {
          handleRowClickSelect(rows[0], 0)
        }
        toast.success(`Loaded ${rows.length} child components for Index Model No "${modelNoVal}".`)
      }
    }
  }

  const handleRowClickSelect = (rowObj, idx) => {
    setActivePreviewRowIdx(idx)
    const keys = Object.keys(rowObj)
    const partNoKey = keys.find(k => {
      const l = k.toLowerCase()
      return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno'
    })
    const partNo = partNoKey ? String(rowObj[partNoKey] || '').trim() : (rowObj.PartNo || rowObj['Part No'] || rowObj.partNo || rowObj.itemCode || '')

    const partNameKey = keys.find(k => {
      const l = k.toLowerCase()
      return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description')
    })
    const partName = partNameKey ? String(rowObj[partNameKey] || '').trim() : (rowObj.PartName || rowObj['Part Name'] || rowObj.partName || '')

    const imgVal = Object.values(rowObj).find(val =>
      typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/') || val.startsWith('/api/'))
    )

    if (partNo) {
      const item = itemMaster.find(im => String(im.partNo || '').trim().toLowerCase() === String(partNo).trim().toLowerCase())
      if (item) {
        setSelectedPart(imgVal ? { ...item, image: imgVal, partName: item.partName || partName } : { ...item, partName: item.partName || partName })
        return
      }
    }

    if (imgVal) {
      setSelectedPart({ image: imgVal, partNo, partName })
    } else if (partNo) {
      setSelectedPart({ partNo, partName })
    }
  }

  const handleAssemblyPartNoChange = (partNoVal) => {
    const item = itemMaster.find(i => i.partNo === partNoVal)
    const matchedGroup = item ? itemGroups.find(g => Number(g.id) === Number(item.groupId)) : null
    
    setForm(f => ({
      ...f,
      assemblyPartNo: partNoVal,
      groupName: matchedGroup ? matchedGroup.groupName : (item?.partName || f.groupName)
    }))
    
    if (item) {
      setSelectedPart(item)
    }

    // Look up child components in Index Creation for this assembly part no
    const pValLower = String(partNoVal).trim().toLowerCase()
    const matchingIndex = indexRecords.find(i => 
      (i.modelNo && i.modelNo.trim().toLowerCase() === pValLower) ||
      (i.assemblyPartNo && i.assemblyPartNo.trim().toLowerCase() === pValLower) ||
      (i.excelData && JSON.stringify(i.excelData).toLowerCase().includes(pValLower))
    )

    if (matchingIndex) {
      const raw = matchingIndex.excelData
      const rows = Array.isArray(raw) ? raw : (raw?.excelData || [])
      if (rows && rows.length > 0) {
        setExcelData(rows)
        setSelectedRows(rows.map((_, i) => i))
        setActivePreviewRowIdx(0)
        if (rows[0]) {
          handleRowClickSelect(rows[0], 0)
        }
        if (matchingIndex.modelNo && !form.modelNo) {
          setForm(f => ({
            ...f,
            modelNo: matchingIndex.modelNo,
            model: matchingIndex.model || f.model
          }))
        }
        toast.success(`Loaded ${rows.length} child components for Assembly Part No "${partNoVal}".`)
      }
    }
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
    const customerVehiclesTotal = vehicles.filter(v => Number(v.customerId) === Number(cust.id))
    setForm(f => ({
      ...f,
      customerName: customerNameVal,
      customerCode: cust.cCode || '',
      vehicleCount: customerVehiclesTotal.length
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
      const matchingBooking = bookings.find(b => b.vehicleSerialNo === vehicle.serialNumber)
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
      const custObj = customers.find(c => c.customerName === booking.customerName)
      const count = custObj ? vehicles.filter(v => Number(v.customerId) === Number(custObj.id)).length : 0

      setForm(f => ({
        ...f,
        serviceJobNo: serviceJobNoVal,
        customerName: booking.customerName || '',
        customerCode: booking.customerCode || '',
        vehicleSerialNo: booking.vehicleSerialNo || booking.serialNo || '',
        model: booking.vehicleModelNo || '',
        vehicleCount: count
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

    // Always fetch fresh BOM list from server to ensure deleted BOMs are not falsely blocked
    let currentRecords = createdRecords
    try {
      const freshRes = await api.get('/api/bom-creation', { skipGlobalLoader: true })
      if (freshRes.data?.success && Array.isArray(freshRes.data.data)) {
        currentRecords = freshRes.data.data
        setCreatedRecords(currentRecords)
      }
    } catch (e) {
      console.error('Failed to sync fresh BOMs:', e)
    }

    // Check duplicate BOM in existing records
    const isDuplicate = currentRecords.some(r => {
      const sameJob = String(r.serviceJobNo || '').trim().toLowerCase() === String(form.serviceJobNo || '').trim().toLowerCase()
      if (!sameJob) return false
      if (form.fileName && r.fileName) {
        return String(r.fileName).trim().toLowerCase() === String(form.fileName).trim().toLowerCase()
      }
      if (form.assemblyPartNo && r.assemblyPartNo) {
        return String(r.assemblyPartNo).trim().toLowerCase() === String(form.assemblyPartNo).trim().toLowerCase()
      }
      return false
    })
    if (isDuplicate) {
      toast.error(`BOM already exists for Service Job No "${form.serviceJobNo}"${form.fileName ? ` and File "${form.fileName}"` : ''}${form.assemblyPartNo ? ` (${form.assemblyPartNo})` : ''}. Duplicate entry rejected.`)
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
        const updated = [savedRecord, ...currentRecords]
        setCreatedRecords(updated)
        queryClient.invalidateQueries({ queryKey: ['bom-creation'] })
        refetchBoms()
        toast.success('BOM Uploaded & Saved Successfully!')
        handleClear(updated)
      } else {
        toast.error(res.data?.message || 'Error saving BOM record.')
      }
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Error saving BOM to database.')
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
      modelNo: '',
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
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setForm(f => ({
      ...f,
      fileName: file.name,
      fileLocation: file.webkitRelativePath || file.name
    }))

    showLoader('Processing Excel file...')

    try {
      const buffer = await file.arrayBuffer()

      // Ensure we have current item master list
      let currentItemMaster = itemMaster
      if (!currentItemMaster || currentItemMaster.length === 0) {
        try {
          const imRes = await api.get('/api/item-master?limit=10000', { skipGlobalLoader: true })
          currentItemMaster = imRes.data?.data || []
          setItemMaster(currentItemMaster)
        } catch (err) {
          console.error('Failed to pre-fetch item master:', err)
        }
      }

      const itemMasterMap = new Map()
      currentItemMaster.forEach(im => {
        if (im.partNo) {
          itemMasterMap.set(String(im.partNo).trim().toLowerCase(), im)
        }
      })

      let parsedRows = []
      let headers = []
      let excelJsSuccess = false

      // 1. Try ExcelJS first for .xlsx to extract embedded images
      try {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]
        if (worksheet && worksheet.rowCount > 0) {
          const extractCellText = (cell) => {
            if (!cell || cell.value === null || cell.value === undefined) return ''
            if (typeof cell.value === 'object') {
              if (Array.isArray(cell.value.richText)) {
                return cell.value.richText.map(t => t.text).join('').trim()
              }
              if (cell.value.result !== undefined) {
                return String(cell.value.result).trim()
              }
              if (cell.value.text !== undefined) {
                return String(cell.value.text).trim()
              }
            }
            return String(cell.value).trim()
          }

          // Detect header row (first row with columns)
          let headerRowIndex = 1
          for (let r = 1; r <= Math.min(10, worksheet.rowCount); r++) {
            const row = worksheet.getRow(r)
            let cellCount = 0
            row.eachCell({ includeEmpty: false }, (cell) => {
              const text = extractCellText(cell).toLowerCase()
              if (text.includes('part') || text.includes('s.no') || text.includes('sno') || text.includes('desc') || text.includes('name') || text.includes('qty')) {
                cellCount += 2
              } else if (text) {
                cellCount += 1
              }
            })
            if (cellCount >= 2) {
              headerRowIndex = r
              break
            }
          }

          const headerRow = worksheet.getRow(headerRowIndex)
          headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const hText = extractCellText(cell)
            headers[colNumber] = hText || `Column ${colNumber}`
          })

          worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber <= headerRowIndex) return // Skip header & banner rows

            const rowData = {}
            let hasAnyValue = false
            headers.forEach((header, index) => {
              if (index > 0) {
                const cell = row.getCell(index)
                const text = extractCellText(cell)
                if (text) hasAnyValue = true
                rowData[header] = text
              }
            })
            if (hasAnyValue) {
              parsedRows.push({ rowNumber, data: rowData })
            }
          })

          // Extract embedded images
          const images = worksheet.getImages() || []
          images.forEach((imgObj) => {
            const image = workbook.model.media.find(m => m.index === imgObj.imageId)
            if (!image) return
            const base64Data = image.buffer.toString('base64')
            const mimeType = image.type === 'png' ? 'image/png' : 'image/jpeg'
            const imgSrc = `data:${mimeType};base64,${base64Data}`

            const tl = imgObj.range.tl
            const rowIdx = Math.floor(tl.row) - headerRowIndex
            const colIdx = Math.floor(tl.col) + 1

            if (parsedRows[rowIdx]) {
              const headerName = headers[colIdx]
              if (headerName) {
                parsedRows[rowIdx].data[headerName] = imgSrc
              }
            }
          })

          if (parsedRows.length > 0) {
            excelJsSuccess = true
          }
        }
      } catch (e) {
        console.warn('ExcelJS parsing failed, falling back to XLSX parser:', e)
      }

      // 2. Fallback to XLSX library for .xls / .csv or if ExcelJS had no rows
      if (!excelJsSuccess) {
        const wb = XLSX.read(buffer, { type: 'array' })
        const sheetName = wb.SheetNames[0]
        const ws = wb.Sheets[sheetName]
        const rawJson = XLSX.utils.sheet_to_json(ws, { defval: '' })
        if (rawJson.length > 0) {
          headers = Object.keys(rawJson[0])
          parsedRows = rawJson.map((r, idx) => ({ rowNumber: idx + 2, data: r }))
        }
      }

      if (parsedRows.length === 0) {
        toast.warning('The selected Excel file is empty or could not be read.')
        setExcelData([])
        setSelectedRows([])
        hideLoader()
        return
      }

      // Find headers for Part No and Part Name
      const partNoHeader = headers.find(h => {
        if (!h) return false
        const l = h.toLowerCase()
        return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno' || l.includes('item code')
      })

      const partNameHeader = headers.find(h => {
        if (!h) return false
        const l = h.toLowerCase()
        return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description')
      })

      const validRows = []
      const skipped = []

      for (const rowObj of parsedRows) {
        const row = { ...rowObj.data }
        const rowNum = rowObj.rowNumber
        const partNoVal = partNoHeader ? String(row[partNoHeader] || '').trim() : ''

        const imgVal = Object.values(row).find(val =>
          typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/') || val.startsWith('/api/'))
        ) || null

        if (!partNoVal) {
          const hasContent = Object.values(row).some(v => typeof v === 'string' && v.trim().length > 0)
          if (!hasContent) continue
        }

        const matchedItem = partNoVal ? itemMasterMap.get(partNoVal.toLowerCase()) : null

        if (matchedItem) {
          if (partNameHeader && matchedItem.partName) {
            row[partNameHeader] = matchedItem.partName
          }
          if (!imgVal) {
            if (matchedItem.hasImage || matchedItem.imageMimeType) {
              row['Image'] = `/api/item-master/${matchedItem.id}/download-image`
            } else if (matchedItem.imagePath) {
              row['Image'] = matchedItem.imagePath.startsWith('http') || matchedItem.imagePath.startsWith('/')
                ? matchedItem.imagePath
                : `/uploads/${matchedItem.imagePath}`
            }
          }
        }

        validRows.push(row)
      }

      setSkippedRecords(skipped)

      if (validRows.length === 0) {
        toast.warning('No items found in the Excel sheet.')
        setExcelData([])
        setSelectedRows([])
        hideLoader()
        return
      }

      setExcelData(validRows)
      setSelectedRows(validRows.map((_, idx) => idx))
      setActivePreviewRowIdx(0)
      if (validRows[0]) {
        handleRowClickSelect(validRows[0], 0)
      }
      toast.success(`Processed Assembly List loaded successfully! (${validRows.length} items found)`)
    } catch (err) {
      console.error('Error reading Excel file:', err)
      toast.error('Error processing Excel file.')
    } finally {
      hideLoader()
    }
  }

  // Memoized options for select elements
  const customerVehicles = useMemo(() => {
    const custObj = customers.find(c => c.customerName === form.customerName)
    return custObj ? vehicles.filter(v => Number(v.customerId) === Number(custObj.id)) : []
  }, [customers, vehicles, form.customerName])

  const vehicleOptions = useMemo(() => {
    const opts = []
    customerVehicles.forEach((v, idx) => {
      const vBookings = bookings.filter(b => b.vehicleSerialNo === v.serialNumber || b.serialNo === v.serialNumber)
      const hasOpenBooking = vBookings.some(b => {
        const tempSt = (b.tempStatus || '').toLowerCase()
        const st = (b.status || '').toLowerCase()
        return tempSt !== 'close' && tempSt !== 'closed' && st !== 'close' && st !== 'closed'
      })
      if (hasOpenBooking) {
        opts.push(String(idx + 1))
      }
    })
    return opts
  }, [customerVehicles, bookings])

  const selectedVehicleLabel = useMemo(() => {
    if (!form.vehicleSerialNo) return ''
    const idx = customerVehicles.findIndex(v => v.serialNumber === form.vehicleSerialNo)
    return idx !== -1 ? String(idx + 1) : ''
  }, [customerVehicles, form.vehicleSerialNo])

  const bookingServiceJobNoOptions = useMemo(() => {
    return bookings
      .filter(b => {
        const tempSt = (b.tempStatus || '').toLowerCase()
        const st = (b.status || '').toLowerCase()
        return tempSt !== 'close' && tempSt !== 'closed' && st !== 'close' && st !== 'closed'
      })
      .map(b => b.serviceJobNo)
      .filter(Boolean)
  }, [bookings])

  const modelOptions = useMemo(() => {
    return Array.from(new Set(vehicles.map(v => v.modelName).filter(Boolean))).sort()
  }, [vehicles])

  const groupNameOptions = useMemo(() => {
    return Array.from(new Set(itemGroups.map(g => g.groupName).filter(Boolean))).sort()
  }, [itemGroups])

  const selectedPartImage = useMemo(() => {
    if (selectedPart) {
      if (selectedPart.image) {
        return selectedPart.image
      }
      if (selectedPart.hasImage || selectedPart.imageMimeType) {
        return `/api/item-master/${selectedPart.id}/download-image`
      }
      if (selectedPart.imagePath) {
        return selectedPart.imagePath.startsWith('http') || selectedPart.imagePath.startsWith('/')
          ? selectedPart.imagePath
          : `/uploads/${selectedPart.imagePath}`
      }
    }

    if (form.assemblyPartNo) {
      const item = itemMaster.find(i => String(i.partNo || '').trim().toLowerCase() === String(form.assemblyPartNo).trim().toLowerCase())
      if (item) {
        if (item.hasImage || item.imageMimeType) {
          return `/api/item-master/${item.id}/download-image`
        }
        if (item.imagePath) {
          return item.imagePath.startsWith('http') || item.imagePath.startsWith('/')
            ? item.imagePath
            : `/uploads/${item.imagePath}`
        }
      }
    }

    return null
  }, [selectedPart, form.assemblyPartNo, itemMaster])

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
        onClick={(e) => { e.target.value = null }}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="max-w-5xl mx-auto flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">BOM Creation</span>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
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
            <div className="grid grid-cols-12 gap-8">
              {/* Left Column: BOM Form Fields & Buttons */}
              <div className="col-span-9 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label required>Entry Date</Label>
                    <Input type="date" value={form.date} onChange={u('date')} />
                  </div>
                  <div>
                    <Label>BOM No</Label>
                    <Input value={form.bomNo} readOnly placeholder="Auto-generated" className="!font-bold !text-[#0097A7]" />
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
                  <div>
                    <Label>Model No (Index)</Label>
                    <SearchableSelect
                      options={modelNoOptions}
                      value={form.modelNo}
                      onChange={handleModelNoSelect}
                      placeholder="Search / Select Model No..."
                      className="w-full"
                    />
                  </div>

                  <div>
                    <Label>Group Name</Label>
                    <Select options={groupNameOptions} value={form.groupName} onChange={e => handleGroupNameChange(e.target.value)} placeholder="Pick Group" />
                  </div>
                  <div>
                    <Label>Assembly Part No</Label>
                    <SearchableSelect
                      options={assemblyPartNoOptions}
                      value={form.assemblyPartNo}
                      onChange={handleAssemblyPartNoChange}
                      placeholder="Select/Search Assembly Part No..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label required>File Name</Label>
                    <Input value={form.fileName} readOnly placeholder="No file chosen" />
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                  <button onClick={handleBrowseClick} className="px-6 py-2.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[13px] font-bold rounded-lg transition-all shadow-sm active:scale-95 flex items-center gap-2">
                    <Search size={16} className="text-[#0097A7]" /> Browse
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="px-6 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center gap-2"
                  >
                    {isCreating ? <RotateCcw size={16} className="animate-spin" /> : <Plus size={16} />}
                    {isCreating ? 'Uploading' : 'Upload'}
                  </button>
                </div>
              </div>

              {/* Right Column: Image Preview */}
              <div className="col-span-3 space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Model Visualization</Label>
                  {selectedPart && (
                    <span className="text-[10px] font-bold text-[#0097A7] bg-[#0097A7]/10 px-2 py-0.5 rounded">
                      Selected Item
                    </span>
                  )}
                </div>
                <div className="aspect-square w-full bg-slate-50 border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-300 overflow-hidden relative p-2 shadow-inner">
                  {selectedPartImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      {selectedPartImage.startsWith('data:image/') || selectedPartImage.startsWith('http') ? (
                        <img
                          src={selectedPartImage}
                          alt={selectedPart?.partName || selectedPart?.partNo || "Preview"}
                          className="max-w-full max-h-[82%] object-contain rounded-lg shadow-sm"
                        />
                      ) : (
                        <AuthenticatedImage
                          src={selectedPartImage}
                          alt={selectedPart?.partName || selectedPart?.partNo || "Preview"}
                          className="max-w-full max-h-[82%] object-contain rounded-lg shadow-sm"
                        />
                      )}
                      {(selectedPart?.partNo || selectedPart?.partName) && (
                        <div className="mt-1 text-center truncate max-w-full px-1">
                          <span className="text-[11px] font-bold text-[#0097A7] block font-mono truncate">{selectedPart.partNo}</span>
                          <span className="text-[10px] text-slate-600 font-medium truncate block">{selectedPart.partName}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center px-2">
                      <ImageIcon size={54} strokeWidth={1} className="transition-transform text-slate-300 mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        {selectedPart?.partNo ? `${selectedPart.partNo} (No Image)` : 'No Preview Available'}
                      </p>
                      {selectedPart?.partName && (
                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-full mt-0.5">
                          {selectedPart.partName}
                        </p>
                      )}
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
                      {excelData.map((row, idx) => {
                        const isActivePreview = activePreviewRowIdx === idx;
                        return (
                        <tr
                          key={idx}
                          onClick={() => handleRowClickSelect(row, idx)}
                          className={`transition-colors cursor-pointer group ${
                            isActivePreview
                              ? 'bg-[#0097A7]/25 border-l-4 border-[#0097A7] font-semibold'
                              : selectedRows.includes(idx)
                                ? 'bg-[#0097A7]/10 hover:bg-[#0097A7]/15'
                                : 'hover:bg-slate-50'
                          }`}
                        >
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
                                className="px-5 py-2.5 border-r border-slate-200 text-slate-700 text-sm outline-none focus:bg-slate-50 group-hover:text-white"
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
                        );
                      })}
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

