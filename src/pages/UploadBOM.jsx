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

  // 2. All Model No Options from Index Creation
  const modelNoOptions = useMemo(() => {
    return Array.from(new Set(indexRecords.map(i => i.modelNo).filter(Boolean))).sort()
  }, [indexRecords])

  // 3. All Assembly Part No Options from Item Master, Index Creation & BOM Records
  const assemblyPartNoOptions = useMemo(() => {
    const imParts = itemMaster.map(item => item.partNo).filter(Boolean)
    const idxModels = indexRecords.map(i => i.modelNo).filter(Boolean)
    const idxAssemblies = indexRecords.map(i => i.assemblyPartNo).filter(Boolean)
    const bomAssemblies = bomRecords.map(b => b.assemblyPartNo || b.bomNo).filter(Boolean)
    return Array.from(new Set([...imParts, ...idxModels, ...idxAssemblies, ...bomAssemblies])).sort()
  }, [itemMaster, indexRecords, bomRecords])

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

  // 4. Handle Model No Selection -> Auto-load child components from Index Creation
  const handleModelNoSelect = (modelNoVal) => {
    const matchedIndex = indexRecords.find(i => String(i.modelNo).trim().toLowerCase() === String(modelNoVal).trim().toLowerCase())
    setForm(f => ({
      ...f,
      modelNo: modelNoVal,
      model: matchedIndex?.model || f.model,
      fileName: matchedIndex?.fileName || f.fileName,
      fileLocation: matchedIndex?.fileLocation || f.fileLocation,
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
        setAssemblyList(formatted)
        setSelectedPartId(null)
        setUploadedPartIds([])
        toast.success(`Loaded ${formatted.length} child components for Index Model No "${modelNoVal}".`)
      }
    }
  }

  // 5. Handle Assembly Part No Selection / Typing -> Fetch matching assembly & auto-load child components (matching part comes first)
  const handleAssemblyPartNoChange = (partNoVal) => {
    setForm(f => ({ ...f, assemblyPartNo: partNoVal }))

    if (!partNoVal || !String(partNoVal).trim()) return

    const pValLower = String(partNoVal).trim().toLowerCase()

    // Match in indexRecords (exact match first, then partial match)
    const matchingIndex = indexRecords.find(i => 
      (i.assemblyPartNo && String(i.assemblyPartNo).trim().toLowerCase() === pValLower) ||
      (i.modelNo && String(i.modelNo).trim().toLowerCase() === pValLower)
    ) || indexRecords.find(i =>
      (i.assemblyPartNo && String(i.assemblyPartNo).trim().toLowerCase().includes(pValLower)) ||
      (i.modelNo && String(i.modelNo).trim().toLowerCase().includes(pValLower)) ||
      (i.excelData && JSON.stringify(i.excelData).toLowerCase().includes(pValLower))
    )

    // Match in bomRecords
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

        // Sort so the searched part number comes first
        formatted.sort((a, b) => {
          const aP = String(a.part || '').toLowerCase()
          const bP = String(b.part || '').toLowerCase()
          if (aP === pValLower && bP !== pValLower) return -1
          if (bP === pValLower && aP !== pValLower) return 1
          if (aP.startsWith(pValLower) && !bP.startsWith(pValLower)) return -1
          if (!aP.startsWith(pValLower) && bP.startsWith(pValLower)) return 1
          return 0
        })

        setAssemblyList(formatted)
        setSelectedPartId(null)
        setUploadedPartIds([])
        if (matchingIndex.modelNo && !form.modelNo) {
          setForm(f => ({
            ...f,
            modelNo: matchingIndex.modelNo,
            model: matchingIndex.model || f.model,
            fileName: matchingIndex.fileName || f.fileName,
            fileLocation: matchingIndex.fileLocation || f.fileLocation
          }))
        }
        toast.success(`Loaded ${formatted.length} child components for Assembly Part No "${partNoVal}".`)
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

        // Sort so the searched part number comes first
        formatted.sort((a, b) => {
          const aP = String(a.part || '').toLowerCase()
          const bP = String(b.part || '').toLowerCase()
          if (aP === pValLower && bP !== pValLower) return -1
          if (bP === pValLower && aP !== pValLower) return 1
          if (aP.startsWith(pValLower) && !bP.startsWith(pValLower)) return -1
          if (!aP.startsWith(pValLower) && bP.startsWith(pValLower)) return 1
          return 0
        })

        setAssemblyList(formatted)
        setSelectedPartId(null)
        setUploadedPartIds([])
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

  // Prioritize searched part numbers to come first in table view
  const displayedAssemblyList = useMemo(() => {
    const q = (listSearch || '').trim().toLowerCase()
    if (!q) return assemblyList

    const exact = []
    const startsWith = []
    const includes = []
    const others = []

    assemblyList.forEach(item => {
      const p = String(item.part || '').toLowerCase()
      const d = String(item.desc || '').toLowerCase()
      if (p === q) {
        exact.push(item)
      } else if (p.startsWith(q)) {
        startsWith.push(item)
      } else if (p.includes(q) || d.includes(q)) {
        includes.push(item)
      } else {
        others.push(item)
      }
    })

    return [...exact, ...startsWith, ...includes, ...others]
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

      const uomHeader = headers.find(h => {
        if (!h) return false
        const l = h.toLowerCase()
        return l.includes('uom') || l === 'unit' || l.includes('measure')
      })

      const itemsList = parsedRows.map((rObj, idx) => {
        const row = rObj.data
        const partNo = partNoHeader ? String(row[partNoHeader] || '').trim() : (row.PartNo || row['Part No'] || `P-${idx + 1}`)
        const desc = partNameHeader ? String(row[partNameHeader] || '').trim() : (row.PartName || row['Part Name'] || row.Description || '—')
        const qty = qtyHeader ? Number(row[qtyHeader]) || 1 : (Number(row.Qty) || 1)
        const unit = uomHeader ? String(row[uomHeader] || 'PCS').trim() : (row.Unit || 'PCS')
        const imgVal = Object.values(row).find(v => typeof v === 'string' && (v.startsWith('data:image/') || v.startsWith('/uploads/') || v.startsWith('/api/'))) || null

        return {
          id: idx + 1,
          part: partNo,
          desc: desc,
          qty: qty,
          unit: unit,
          image: imgVal
        }
      }).filter(item => item.part && item.part !== '—')

      setAssemblyList(itemsList)
      setSelectedPartId(null)
      setUploadedPartIds([])
      toast.success(`Excel file processed! Loaded ${itemsList.length} parts into Processed Assembly List.`)
    } catch (err) {
      console.error('Error processing Excel file in UploadBOM:', err)
      toast.error('Error reading Excel file.')
    } finally {
      hideLoader()
    }
  }

  const handleProcess = () => {
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

    setIsProcessing(true)
    setTimeout(() => {
      setUploadedPartIds(prev => [...prev, selectedPartId])
      setIsProcessing(false)
      toast.success(`Successfully uploaded BOM Specification for Part "${selectedItem.part}"!`)
    }, 400)
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

                <div className="pt-2">
                  <button 
                    onClick={handleProcess}
                    disabled={isProcessing || assemblyList.length === 0 || selectedPartId === null}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessing ? <RotateCcw size={15} className="animate-spin" /> : <Upload size={15} />}
                    Upload BOM
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
                     <button onClick={() => { setAssemblyList([]); setSelectedPartId(null); setUploadedPartIds([]); setListSearch('') }} className="text-rose-500 hover:text-rose-600 text-[11px] font-bold uppercase flex items-center gap-1 transition-colors">
                       <Trash2 size={14} /> Clear List
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
                            <th className="px-4 py-3 text-center w-16">Unit</th>
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
                                onClick={() => setSelectedPartId(item.id)}
                                className={`${rowBg} transition-colors group h-12 border-b border-slate-100 cursor-pointer`}
                              >
                                <td className="px-4 py-2 text-center border-r border-slate-100" onClick={(e) => e.stopPropagation()}>
                                  <input 
                                    type="radio"
                                    name="selectedAssemblyPart"
                                    checked={isSelected}
                                    onChange={() => setSelectedPartId(item.id)}
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
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-black ${unitBadge}`}>{item.unit}</span>
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
