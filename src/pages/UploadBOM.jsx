import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ChevronRight, Upload, Search, X, Trash2, FileSpreadsheet, RotateCcw, CheckSquare, Square, Eye, ImageIcon } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { useLoading } from '../context/LoadingContext'

// ── Shared UI primitives ──
const Label = ({ children, required }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
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
    className={`w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 ${readOnly ? 'bg-slate-50 cursor-not-allowed text-slate-600 font-medium' : 'hover:border-slate-300'} ${className}`}
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

const SearchableSelect = ({ options, value, onChange, placeholder, className = "" }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    setQuery(value || '')
  }, [value])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = useMemo(() => {
    if (!query) return options
    const q = query.toLowerCase().trim()
    return [...options]
      .filter(o => String(o).toLowerCase().includes(q))
      .sort((a, b) => {
        const aStr = String(a).toLowerCase()
        const bStr = String(b).toLowerCase()
        // Exact match comes first
        if (aStr === q && bStr !== q) return -1
        if (bStr === q && aStr !== q) return 1
        // Starts with query comes second
        const aStarts = aStr.startsWith(q)
        const bStarts = bStr.startsWith(q)
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        return aStr.localeCompare(bStr)
      })
  }, [options, query])

  return (
    <div ref={ref} className={`relative ${className}`}>
      <input
        type="text"
        className="w-full px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300"
        placeholder={placeholder}
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value)
          onChange(e.target.value)
          setOpen(true)
        }}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-sm">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              className="px-3 py-2 hover:bg-[#0097A7]/10 hover:text-[#0097A7] cursor-pointer font-medium"
              onMouseDown={() => {
                setQuery(item)
                onChange(item)
                setOpen(false)
              }}
            >
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function UploadBOM() {
  const toast = useToast()
  const { showLoader, hideLoader } = useLoading()
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    modelNo: '',
    model: '',
    assemblyPartNo: '',
    fileLocation: '',
    fileName: ''
  })

  const [assemblyList, setAssemblyList] = useState([])
  const [listSearch, setListSearch] = useState('')
  const [selectedPartId, setSelectedPartId] = useState(null)
  const [uploadedPartIds, setUploadedPartIds] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [indexRecords, setIndexRecords] = useState([])
  const [itemMaster, setItemMaster] = useState([])
  const [bomRecords, setBomRecords] = useState([])

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  // 1. Fetch Index Records, Item Master & BOM Records
  const fetchData = useCallback(async () => {
    try {
      const [idxRes, imRes, bomRes] = await Promise.all([
        api.get('/api/index-creation?limit=1000', { skipGlobalLoader: true }).catch(() => ({ data: { data: [] } })),
        api.get('/api/item-master?limit=10000', { skipGlobalLoader: true }).catch(() => ({ data: { data: [] } })),
        api.get('/api/bom-creation?limit=1000', { skipGlobalLoader: true }).catch(() => ({ data: { data: [] } }))
      ])
      setIndexRecords(idxRes.data?.data || [])
      setItemMaster(imRes.data?.data || [])
      setBomRecords(bomRes.data?.data || [])
    } catch (e) {
      console.error('Failed to load reference data in UploadBOM:', e)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Helper to check if a part is already uploaded in BOM records for a model
  const isPartUploadedInBom = useCallback((partNo, modelName, modelNoVal) => {
    if (!partNo) return false
    const pLower = String(partNo).trim().toLowerCase()
    const mLower = modelName ? String(modelName).trim().toLowerCase() : ''
    const mnoLower = modelNoVal ? String(modelNoVal).trim().toLowerCase() : ''

    return bomRecords.some(b => {
      const bModel = String(b.model || '').trim().toLowerCase()
      const bModelNo = String(b.modelNo || '').trim().toLowerCase()
      const bAssembly = String(b.assemblyPartNo || '').trim().toLowerCase()

      const modelMatches =
        (!mLower && !mnoLower) ||
        (mLower && (bModel === mLower || bModelNo === mLower)) ||
        (mnoLower && (bModel === mnoLower || bModelNo === mnoLower)) ||
        bAssembly === pLower

      if (!modelMatches) return false

      if (bAssembly === pLower) return true

      const rows = Array.isArray(b.excelRows) ? b.excelRows : []
      return rows.some(r => {
        const rp = r.PartNo || r['Part No'] || r.partNo || r['Part Number'] || r.itemCode || r.part
        return rp && String(rp).trim().toLowerCase() === pLower
      })
    })
  }, [bomRecords])

  // 2. All Model No Options from Index Creation
  const modelNoOptions = useMemo(() => {
    const list = []
    indexRecords.forEach(i => {
      if (i.modelNo) list.push(i.modelNo)
      if (i.model && !list.includes(i.model)) list.push(i.model)
    })
    return Array.from(new Set(list)).sort()
  }, [indexRecords])

  // 3. All Assembly Part No Options (Prioritizing loaded components of selected model, then item master, index & BOM)
  const assemblyPartNoOptions = useMemo(() => {
    const currentListParts = assemblyList.map(item => item.part).filter(Boolean)
    const imParts = itemMaster.map(item => item.partNo).filter(Boolean)
    const idxModels = indexRecords.map(i => i.modelNo).filter(Boolean)
    const idxAssemblies = indexRecords.map(i => i.assemblyPartNo).filter(Boolean)
    const bomAssemblies = bomRecords.map(b => b.assemblyPartNo || b.bomNo).filter(Boolean)
    return Array.from(new Set([...currentListParts, ...imParts, ...idxModels, ...idxAssemblies, ...bomAssemblies])).sort()
  }, [assemblyList, itemMaster, indexRecords, bomRecords])

  // Helper to extract clean text from any Excel cell
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

  // 4. Handle Model No Selection -> Auto-load child components & fetch previously uploaded BOM count
  const handleModelNoSelect = (modelNoVal) => {
    const matchedIndex = indexRecords.find(i =>
      String(i.modelNo).trim().toLowerCase() === String(modelNoVal).trim().toLowerCase() ||
      String(i.model).trim().toLowerCase() === String(modelNoVal).trim().toLowerCase()
    )

    const targetModel = matchedIndex?.model || ''
    const targetModelNo = matchedIndex?.modelNo || modelNoVal

    setForm(f => ({
      ...f,
      modelNo: targetModelNo,
      model: targetModel || f.model,
      fileName: matchedIndex?.fileName || f.fileName,
      fileLocation: matchedIndex?.fileLocation || f.fileLocation,
      assemblyPartNo: ''
    }))

    if (matchedIndex) {
      const rawRows = matchedIndex.excelData
      const rows = Array.isArray(rawRows) ? rawRows : (rawRows?.excelData || [])
      if (rows && rows.length > 0) {
        const formatted = rows.map((r, idx) => {
          const partNo = r.PartNo || r['Part No'] || r.partNo || r['Part Number'] || r.itemCode || `P-${idx + 1}`
          const desc = r.PartName || r['Part Name'] || r.partName || r.description || r.desc || r.Name || '—'
          const qty = r.Qty || r.qty || 1
          const unit = r.Unit || r.unit || r.UOM || r.uom || 'PCS'
          const image = r.Image || r.image || r.Pic || r.pic || null
          return { id: idx + 1, part: partNo, desc, qty, unit, image }
        })

        // Automatically fetch previously uploaded BOM parts for this model
        const prevUploadedIds = formatted
          .filter(item => isPartUploadedInBom(item.part, targetModel, targetModelNo))
          .map(item => item.id)

        setAssemblyList(formatted)
        setSelectedPartId(null)
        setUploadedPartIds(prevUploadedIds)
        toast.success(`Loaded ${formatted.length} parts for Model "${targetModelNo}". ${prevUploadedIds.length} previously uploaded to BOM.`)
        return
      }
    }

    // Fallback: Check matching BOM records for this model if index has no excel rows
    const matchingBoms = bomRecords.filter(b =>
      (b.model && String(b.model).trim().toLowerCase() === String(targetModelNo).trim().toLowerCase()) ||
      (b.modelNo && String(b.modelNo).trim().toLowerCase() === String(targetModelNo).trim().toLowerCase())
    )
    if (matchingBoms.length > 0) {
      const allRows = []
      matchingBoms.forEach(b => {
        const rows = Array.isArray(b.excelRows) ? b.excelRows : []
        rows.forEach((r, idx) => {
          const partNo = r.PartNo || r['Part No'] || r.partNo || r['Part Number'] || r.itemCode || `P-${idx + 1}`
          const desc = r.PartName || r['Part Name'] || r.partName || r.description || r.desc || r.Name || '—'
          allRows.push({
            id: allRows.length + 1,
            part: partNo,
            desc,
            qty: r.Qty || r.qty || 1,
            unit: r.Unit || r.unit || 'PCS',
            image: r.Image || r.image || null
          })
        })
      })
      if (allRows.length > 0) {
        setAssemblyList(allRows)
        setUploadedPartIds(allRows.map(r => r.id))
        setSelectedPartId(null)
        toast.success(`Loaded ${allRows.length} previously uploaded BOM parts for Model "${targetModelNo}".`)
      }
    }
  }

  // 5. Handle Assembly Part No Selection / Typing -> Works like table search, prioritizing matching part to the top & auto-selecting
  const handleAssemblyPartNoChange = (partNoVal) => {
    setForm(f => ({ ...f, assemblyPartNo: partNoVal }))

    if (!partNoVal || !String(partNoVal).trim()) return

    const pValLower = String(partNoVal).trim().toLowerCase()

    // If assemblyList is already loaded, auto-select if exact match found
    const matchingInList = assemblyList.find(item => String(item.part || '').trim().toLowerCase() === pValLower)
    if (matchingInList) {
      setSelectedPartId(matchingInList.id)
      return
    }

    // If assemblyList is empty, allow loading from index/bom records
    if (assemblyList.length === 0) {
      const matchingIndex = indexRecords.find(i =>
        (i.assemblyPartNo && String(i.assemblyPartNo).trim().toLowerCase() === pValLower) ||
        (i.modelNo && String(i.modelNo).trim().toLowerCase() === pValLower)
      ) || indexRecords.find(i =>
        (i.assemblyPartNo && String(i.assemblyPartNo).trim().toLowerCase().includes(pValLower)) ||
        (i.modelNo && String(i.modelNo).trim().toLowerCase().includes(pValLower)) ||
        (i.excelData && JSON.stringify(i.excelData).toLowerCase().includes(pValLower))
      )

      const matchingBom = bomRecords.find(b =>
        (b.assemblyPartNo && String(b.assemblyPartNo).trim().toLowerCase() === pValLower) ||
        (b.bomNo && String(b.bomNo).trim().toLowerCase() === pValLower)
      ) || bomRecords.find(b =>
        (b.assemblyPartNo && String(b.assemblyPartNo).trim().toLowerCase().includes(pValLower)) ||
        (b.bomNo && String(b.bomNo).trim().toLowerCase().includes(pValLower)) ||
        (b.excelRows && JSON.stringify(b.excelRows).toLowerCase().includes(pValLower))
      )

      if (matchingIndex) {
        const rawRows = matchingIndex.excelData
        const rows = Array.isArray(rawRows) ? rawRows : (rawRows?.excelData || [])
        if (rows && rows.length > 0) {
          let formatted = rows.map((r, idx) => {
            const partNo = r.PartNo || r['Part No'] || r.partNo || r['Part Number'] || r.itemCode || `P-${idx + 1}`
            const desc = r.PartName || r['Part Name'] || r.partName || r.description || r.desc || r.Name || '—'
            const qty = r.Qty || r.qty || 1
            const unit = r.Unit || r.unit || r.UOM || r.uom || 'PCS'
            const image = r.Image || r.image || r.Pic || r.pic || null
            return { id: idx + 1, part: partNo, desc, qty, unit, image }
          })

          const prevUploadedIds = formatted
            .filter(item => isPartUploadedInBom(item.part, matchingIndex.model, matchingIndex.modelNo))
            .map(item => item.id)

          setAssemblyList(formatted)
          setSelectedPartId(null)
          setUploadedPartIds(prevUploadedIds)
          if (matchingIndex.modelNo && !form.modelNo) {
            setForm(f => ({
              ...f,
              modelNo: matchingIndex.modelNo,
              model: matchingIndex.model || f.model,
              fileName: matchingIndex.fileName || f.fileName,
              fileLocation: matchingIndex.fileLocation || f.fileLocation
            }))
          }
          toast.success(`Loaded ${formatted.length} child components for "${partNoVal}". ${prevUploadedIds.length} previously uploaded to BOM.`)
          return
        }
      }

      if (matchingBom) {
        const rawRows = matchingBom.excelRows
        const rows = Array.isArray(rawRows) ? rawRows : []
        if (rows && rows.length > 0) {
          let formatted = rows.map((r, idx) => {
            const partNo = r.PartNo || r['Part No'] || r.partNo || r['Part Number'] || r.itemCode || `P-${idx + 1}`
            const desc = r.PartName || r['Part Name'] || r.partName || r.description || r.desc || r.Name || '—'
            const qty = r.Qty || r.qty || 1
            const unit = r.Unit || r.unit || r.UOM || r.uom || 'PCS'
            const image = r.Image || r.image || r.Pic || r.pic || null
            return { id: idx + 1, part: partNo, desc, qty, unit, image }
          })

          setAssemblyList(formatted)
          setSelectedPartId(null)
          setUploadedPartIds(formatted.map(r => r.id))
          if (matchingBom.model && !form.model) {
            setForm(f => ({
              ...f,
              model: matchingBom.model || f.model,
              fileName: matchingBom.fileName || f.fileName,
            }))
          }
          toast.success(`Loaded ${formatted.length} child components from BOM for "${partNoVal}".`)
          return
        }
      }
    }
  }

  // Processed Assembly List filter (preserves original fixed row order)
  const displayedAssemblyList = useMemo(() => {
    const q = (listSearch || '').trim().toLowerCase()
    if (!q) return assemblyList

    return assemblyList.filter(item => {
      const p = String(item.part || '').toLowerCase()
      const d = String(item.desc || '').toLowerCase()
      return p.includes(q) || d.includes(q)
    })
  }, [assemblyList, listSearch])

  // 6. Handle Browse Click & Excel File Upload
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
      let parsedRows = []
      let headers = []
      let excelJsSuccess = false

      // Try ExcelJS first for .xlsx
      try {
        const workbook = new ExcelJS.Workbook()
        await workbook.xlsx.load(buffer)
        const worksheet = workbook.worksheets[0]
        if (worksheet && worksheet.rowCount > 0) {
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
            if (rowNumber <= headerRowIndex) return
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

          if (parsedRows.length > 0) excelJsSuccess = true
        }
      } catch (e) {
        console.warn('ExcelJS load fallback to XLSX:', e)
      }

      // Fallback to XLSX
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
        toast.warning('The selected Excel file is empty or could not be parsed.')
        setAssemblyList([])
        setSelectedParts([])
        hideLoader()
        return
      }

      // Identify column headers
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

      const qtyHeader = headers.find(h => {
        if (!h) return false
        const l = h.toLowerCase()
        return l.includes('qty') || l.includes('quantity') || l === 'count'
      })

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

      const itemsList = []
      let skippedCount = 0

      parsedRows.forEach((rObj, idx) => {
        const row = rObj.data
        const partNo = partNoHeader ? String(row[partNoHeader] || '').trim() : (row.PartNo || row['Part No'] || '')
        const desc = partNameHeader ? String(row[partNameHeader] || '').trim() : (row.PartName || row['Part Name'] || row.Description || '—')
        const qty = qtyHeader ? Number(row[qtyHeader]) || 1 : (Number(row.Qty) || 1)
        const unit = uomHeader ? String(row[uomHeader] || 'PCS').trim() : (row.Unit || 'PCS')
        const imgVal = Object.values(row).find(v => typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('/uploads/') || v.startsWith('/api/'))) || null

        if (!partNo) return

        const matchedItem = itemMasterMap.get(partNo.toLowerCase())
        if (matchedItem) {
          itemsList.push({
            id: itemsList.length + 1,
            part: matchedItem.partNo || partNo,
            desc: matchedItem.partName || desc,
            qty: qty,
            unit: unit,
            image: imgVal
          })
        } else {
          skippedCount++
        }
      })

      setAssemblyList(itemsList)
      setSelectedPartId(null)
      setUploadedPartIds([])
      if (skippedCount > 0) {
        toast.warning(`Skipped ${skippedCount} row(s) because they were not found in Item Master. Loaded ${itemsList.length} valid parts.`)
      } else {
        toast.success(`Excel file processed! Loaded ${itemsList.length} parts into Processed Assembly List.`)
      }
    } catch (err) {
      console.error('Error processing Excel file in UploadBOM:', err)
      toast.error('Error reading Excel file.')
    } finally {
      hideLoader()
    }
  }

  const handleProcess = async () => {
    if (assemblyList.length === 0) {
      toast.warning('No items in Processed Assembly List to upload.')
      return
    }
    if (selectedPartId === null) {
      toast.warning('Please select a record from the Processed Assembly List to upload.')
      return
    }
    if (uploadedPartIds.includes(selectedPartId)) {
      toast.info('This record is already uploaded.')
      return
    }

    const selectedItem = assemblyList.find(item => item.id === selectedPartId)
    if (!selectedItem) return

    // Enforce data presence in Item Master
    const partNoClean = String(selectedItem.part || '').trim().toLowerCase()
    const isPresentInItemMaster = itemMaster.some(im => String(im.partNo || '').trim().toLowerCase() === partNoClean)

    if (!isPresentInItemMaster) {
      toast.warning(`Part "${selectedItem.part}" is not present in Item Master. Cannot upload.`)
      return
    }

    setIsProcessing(true)
    try {
      const payload = {
        date: form.date,
        customerName: 'Internal Customer',
        serviceJobNo: `JOB-${form.modelNo || 'BOM'}`,
        model: form.model || form.modelNo || '',
        assemblyPartNo: selectedItem.part,
        fileName: form.fileName || `${selectedItem.part}.xlsx`,
        fileLocation: form.fileLocation || '',
        excelRows: [selectedItem]
      }
      try {
        const res = await api.post('/api/bom-creation', payload)
        if (res.data?.success && res.data?.data) {
          setBomRecords(prev => [res.data.data, ...prev])
        }
      } catch (e) {
        console.warn('Backend BOM save notice:', e)
      }

      setUploadedPartIds(prev => [...prev, selectedPartId])
      toast.success(`Successfully uploaded BOM Specification for Part "${selectedItem.part}"!`)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeleteUpload = async () => {
    if (selectedPartId === null) {
      toast.warning('Please select an uploaded record to delete.')
      return
    }
    if (!uploadedPartIds.includes(selectedPartId)) {
      toast.info('Selected record is not uploaded yet.')
      return
    }

    const selectedItem = assemblyList.find(item => item.id === selectedPartId)
    if (!selectedItem) return

    try {
      const selectedPartNoClean = String(selectedItem.part || '').trim().toLowerCase()
      const matchingBoms = bomRecords.filter(b =>
        String(b.assemblyPartNo || '').trim().toLowerCase() === selectedPartNoClean ||
        (Array.isArray(b.excelRows) && b.excelRows.some(r => String(r.PartNo || r.partNo || r.part || '').trim().toLowerCase() === selectedPartNoClean))
      )

      for (const b of matchingBoms) {
        if (b.id) {
          await api.delete(`/api/bom-creation/${b.id}`).catch(() => { })
        }
      }

      setBomRecords(prev => prev.filter(b => !matchingBoms.some(m => m.id === b.id)))
      setUploadedPartIds(prev => prev.filter(id => id !== selectedPartId))
      toast.success(`Deleted upload for Part "${selectedItem.part}".`)
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete upload.')
    }
  }

  const handleDeleteAllUploads = async () => {
    if (uploadedPartIds.length === 0 && assemblyList.length === 0) {
      toast.warning('No uploads to delete.')
      return
    }

    try {
      const currentParts = assemblyList.map(item => String(item.part || '').trim().toLowerCase())
      const bomsToDelete = bomRecords.filter(b => {
        const bAss = String(b.assemblyPartNo || '').trim().toLowerCase()
        return currentParts.includes(bAss) || (b.model && String(b.model).trim().toLowerCase() === String(form.modelNo || '').trim().toLowerCase())
      })

      for (const b of bomsToDelete) {
        if (b.id) {
          await api.delete(`/api/bom-creation/${b.id}`).catch(() => { })
        }
      }

      setBomRecords(prev => prev.filter(b => !bomsToDelete.some(d => d.id === b.id)))
      setUploadedPartIds([])
      toast.success('All uploads deleted successfully.')
    } catch (err) {
      console.error(err)
      toast.error('Failed to delete all uploads.')
    }
  }

  const handleDeleteRow = async (itemId, e) => {
    if (e) e.stopPropagation()
    const itemToDelete = assemblyList.find(item => item.id === itemId)
    if (!itemToDelete) return

    if (uploadedPartIds.includes(itemId)) {
      const partNoClean = String(itemToDelete.part || '').trim().toLowerCase()
      const matchingBoms = bomRecords.filter(b =>
        String(b.assemblyPartNo || '').trim().toLowerCase() === partNoClean ||
        (Array.isArray(b.excelRows) && b.excelRows.some(r => String(r.PartNo || r.partNo || r.part || '').trim().toLowerCase() === partNoClean))
      )

      for (const b of matchingBoms) {
        if (b.id) {
          await api.delete(`/api/bom-creation/${b.id}`).catch(() => { })
        }
      }
      setBomRecords(prev => prev.filter(b => !matchingBoms.some(m => m.id === b.id)))
      setUploadedPartIds(prev => prev.filter(id => id !== itemId))
    }

    setAssemblyList(prev => prev.filter(item => item.id !== itemId))
    if (selectedPartId === itemId) {
      setSelectedPartId(null)
    }
    toast.success(`Removed row for Part "${itemToDelete.part}".`)
  }

  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      modelNo: '',
      model: '',
      assemblyPartNo: '',
      fileLocation: '',
      fileName: ''
    })
    setAssemblyList([])
    setListSearch('')
    setSelectedPartId(null)
    setUploadedPartIds([])
  }

  const uploadedCount = uploadedPartIds.length
  const unUploadCount = assemblyList.length - uploadedCount

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        onClick={(e) => { e.target.value = null }}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Upload BOM</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[750px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">BOM Specification Upload</h2>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95 hover:bg-slate-50">
                <RotateCcw size={14} /> Clear
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-8 grid grid-cols-12 gap-12 flex-1">
            {/* Left Section: Control Panel */}
            <div className="col-span-5 flex flex-col gap-8">
              <div className="space-y-5 bg-slate-50/50 p-6 rounded-2xl border border-slate-100">
                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-4"><Label>Entry Date</Label></div>
                  <div className="col-span-8"><Input type="date" value={form.date} onChange={u('date')} className="!w-48" /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-4"><Label required>Model No (Index)</Label></div>
                  <div className="col-span-8">
                    <SearchableSelect
                      options={modelNoOptions}
                      value={form.modelNo}
                      onChange={handleModelNoSelect}
                      placeholder="Search / Select Model No..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-4"><Label required>Assembly Part No</Label></div>
                  <div className="col-span-8">
                    <SearchableSelect
                      options={assemblyPartNoOptions}
                      value={form.assemblyPartNo}
                      onChange={handleAssemblyPartNoChange}
                      placeholder="Search / Type Assembly Part No..."
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4 pt-2 border-t border-slate-100">
                  <div className="col-span-4"><Label>File Location</Label></div>
                  <div className="col-span-8"><Input placeholder="File location..." value={form.fileLocation} onChange={u('fileLocation')} /></div>
                </div>

                <div className="grid grid-cols-12 items-center gap-4">
                  <div className="col-span-4"><Label required>File Name</Label></div>
                  <div className="col-span-5"><Input placeholder="Selected file..." value={form.fileName} onChange={u('fileName')} readOnly={!!form.fileName} /></div>
                  <div className="col-span-3">
                    <button
                      onClick={handleBrowseClick}
                      className="w-full flex items-center justify-center gap-2 px-3 py-[7px] bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] text-[11px] font-bold rounded-lg border border-[#0097A7]/20 transition-all shadow-sm active:scale-95"
                    >
                      <Search size={14} /> Browse
                    </button>
                  </div>
                </div>

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    onClick={handleProcess}
                    disabled={isProcessing || assemblyList.length === 0 || selectedPartId === null}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? <RotateCcw size={15} className="animate-spin" /> : <Upload size={15} />}
                    Upload BOM
                  </button>
                  <button
                    onClick={handleDeleteUpload}
                    disabled={selectedPartId === null || !uploadedPartIds.includes(selectedPartId)}
                    className="flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    <Trash2 size={15} />
                    Delete Upload
                  </button>
                </div>
              </div>

              {/* Status Counters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">BOM Upload Count</p>
                  <p className={`text-[24px] font-black ${uploadedCount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {uploadedCount}
                  </p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">BOM Un Upload Count</p>
                  <p className={`text-[24px] font-black ${unUploadCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {unUploadCount}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Section: Interactive Assembly List */}
            <div className="col-span-7 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-4 bg-[#0097A7] rounded-full" />
                  Processed Assembly List
                </h3>
                <div className="flex items-center gap-3">
                  {assemblyList.length > 0 && (
                    <div className="relative">
                      <input
                        type="text"
                        value={listSearch}
                        onChange={(e) => setListSearch(e.target.value)}
                        placeholder="Search part no..."
                        className="pl-7 pr-2 py-1 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-36"
                      />
                      <Search size={12} className="absolute left-2 top-2 text-slate-400" />
                    </div>
                  )}
                  {assemblyList.length > 0 && (
                    <span className="text-[11px] font-bold text-slate-500">
                      Total: {assemblyList.length} | Uploaded: <span className="text-emerald-600 font-bold">{uploadedCount}</span> | Un-uploaded: <span className="text-red-600 font-bold">{unUploadCount}</span>
                    </span>
                  )}
                  {assemblyList.length > 0 && (
                    <button
                      onClick={handleDeleteAllUploads}
                      className="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase flex items-center gap-1 transition-all shadow-sm"
                    >
                      <Trash2 size={13} /> Delete All Uploads
                    </button>
                  )}
                  {assemblyList.length > 0 && (
                    <button onClick={() => { setAssemblyList([]); setSelectedPartId(null); setUploadedPartIds([]); setListSearch('') }} className="text-slate-500 hover:text-slate-600 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors">
                      <RotateCcw size={13} /> Clear List
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden relative group transition-all min-h-[480px]">
                {assemblyList.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4 p-8">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center">
                      <FileSpreadsheet size={40} className="opacity-20" />
                    </div>
                    <div className="text-center">
                      <p className="font-black uppercase tracking-widest text-[12px] text-slate-500">No Data Loaded</p>
                      <p className="text-[11px] italic mt-1 text-slate-400">Select a Model No, choose an Assembly Part No, or click Browse to load an Excel file</p>
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 overflow-y-auto p-4 bg-white">
                    <table className="w-full text-left border-collapse border border-slate-200">
                      <thead className="bg-slate-100 text-[10px] uppercase text-slate-600 font-bold border-b border-slate-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 w-12 text-center border-r border-slate-200">Select</th>
                          <th className="px-4 py-3 w-12 text-center border-r border-slate-200">#</th>
                          <th className="px-4 py-3 border-r border-slate-200">Part Number</th>
                          <th className="px-4 py-3 border-r border-slate-200">Description</th>
                          <th className="px-4 py-3 text-center border-r border-slate-200 w-16">Image</th>
                          <th className="px-4 py-3 text-right border-r border-slate-200 w-16">Qty</th>
                          <th className="px-4 py-3 text-center border-r border-slate-200 w-16">Unit</th>
                          <th className="px-4 py-3 text-center w-16">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[12px]">
                        {displayedAssemblyList.map((item, idx) => {
                          const isUploaded = uploadedPartIds.includes(item.id)
                          const isSelected = selectedPartId === item.id
                          const textColor = isUploaded ? 'text-emerald-600' : 'text-red-600'
                          const unitBadge = isUploaded
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                          const rowBg = isSelected
                            ? 'bg-[#0097A7]/10 ring-1 ring-[#0097A7]/40'
                            : (isUploaded ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : 'hover:bg-red-50/30')

                          return (
                            <tr
                              key={item.id}
                              onClick={() => {
                                setSelectedPartId(item.id)
                                setForm(f => ({ ...f, assemblyPartNo: item.part }))
                              }}
                              className={`${rowBg} transition-colors group h-12 border-b border-slate-100 cursor-pointer`}
                            >
                              <td className="px-4 py-2 text-center border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="radio"
                                  name="selectedAssemblyPart"
                                  checked={isSelected}
                                  onChange={() => {
                                    setSelectedPartId(item.id)
                                    setForm(f => ({ ...f, assemblyPartNo: item.part }))
                                  }}
                                  className="w-4 h-4 text-[#0097A7] focus:ring-[#0097A7] cursor-pointer"
                                />
                              </td>
                              <td className={`px-4 py-2 text-center font-bold border-r border-slate-100 ${textColor}`}>{idx + 1}</td>
                              <td className={`px-4 py-2 font-black border-r border-slate-100 ${textColor}`}>{item.part}</td>
                              <td className={`px-4 py-2 font-semibold uppercase text-[11px] border-r border-slate-100 ${textColor}`}>{item.desc}</td>
                              <td className="px-4 py-2 text-center border-r border-slate-100">
                                {item.image ? (
                                  <div className="w-8 h-8 rounded border border-slate-200 overflow-hidden inline-flex items-center justify-center bg-slate-50">
                                    <img src={item.image} alt="preview" className="w-full h-full object-contain" />
                                  </div>
                                ) : (
                                  <span className={textColor}>—</span>
                                )}
                              </td>
                              <td className={`px-4 py-2 text-right font-black border-r border-slate-100 ${textColor}`}>{item.qty}</td>
                              <td className="px-4 py-2 text-center border-r border-slate-100">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${unitBadge}`}>{item.unit}</span>
                              </td>
                              <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                <button
                                  onClick={(e) => handleDeleteRow(item.id, e)}
                                  title="Delete Row"
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center justify-center cursor-pointer"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
