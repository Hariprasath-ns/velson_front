import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import api from '../services/api'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import { ChevronRight, Search, Upload, Download, X, Image as ImageIcon, FileSpreadsheet, RotateCcw, Save, Trash2, Plus } from 'lucide-react'
import { useToast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

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

const isImageHeader = (h) => {
  if (!h) return false
  const lower = h.toLowerCase()
  return lower.includes('image') || lower.includes('diagram') || lower.includes('pic') || lower.includes('photo')
}

const resolveImageSrc = (val) => {
  if (!val || typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (trimmed.startsWith('data:image/')) return trimmed;
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 64) {
    return `data:image/png;base64,${trimmed}`;
  }
  return '';
}


export default function IndexCreation() {
  const toast = useToast()
  const { auth } = useAuth()
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    indexNo: '',
    model: '',
    modelNo: '',
    fileLocation: '',
    fileName: ''
  })

  const [indices, setIndices] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [isSaving, setIsSaving] = useState(false)
  const [vehicleModels, setVehicleModels] = useState([])
  const [excelData, setExcelData] = useState([])
  const [excelHeaders, setExcelHeaders] = useState([])
  const [skippedRecords, setSkippedRecords] = useState([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [backupData, setBackupData] = useState(null)
  const [editRecordId, setEditRecordId] = useState(null)
  const [fileContentBase64, setFileContentBase64] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleteImage, setDeleteImage] = useState(false)
  const [viewPopupImage, setViewPopupImage] = useState(null)


  
  const [searchQuery, setSearchQuery] = useState('')
  const [filterColumn, setFilterColumn] = useState('')
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [showSkippedOnly, setShowSkippedOnly] = useState(false)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterColumn, rowsPerPage])

  const allRows = useMemo(() => {
    const rows = []
    excelData.forEach(r => rows.push({ ...r, _isSkipped: false }))
    skippedRecords.forEach(r => rows.push({ ...r.data, _rowNum: r.row, _isSkipped: true, _missingFields: r.missingFields }))
    rows.sort((a, b) => a._rowNum - b._rowNum)
    return rows
  }, [excelData, skippedRecords])

  const filteredData = allRows.filter(row => {
    if (showSkippedOnly) {
      const missing = excelHeaders.some(h => !row[h])
      if (!missing) return false
    }
    if (!searchQuery) return true
    if (filterColumn) {
      const val = row[filterColumn]
      return val && String(val).toLowerCase().includes(searchQuery.toLowerCase())
    }
    return Object.values(row).some(val => 
      val && String(val).toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
  const paginatedData = filteredData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

  const fileInputRef = useRef(null)

  const u = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const processExcelData = async (dataStr, readType) => {
    try {
      const wb = XLSX.read(dataStr, { type: readType })
      const sheetCount = wb.SheetNames?.length || 0
      setForm(f => ({ ...f, fileLocation: String(sheetCount) }))
      const wsname = wb.SheetNames[0]
      const ws = wb.Sheets[wsname]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 })

      // Extract embedded images from Excel file using ExcelJS
      const imageMap = {}
      try {
        const binaryStr = atob(dataStr)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        const xlWb = new ExcelJS.Workbook()
        await xlWb.xlsx.load(bytes.buffer)
        const xlWs = xlWb.worksheets[0]
        if (xlWs) {
          const images = xlWs.getImages() || []
          images.forEach((imgObj) => {
            const image = xlWb.model.media.find(m => m.index === imgObj.imageId)
            if (!image) return
            const b64 = image.buffer.toString('base64')
            const mime = image.type === 'png' ? 'image/png' : 'image/jpeg'
            const imgSrc = `data:${mime};base64,${b64}`
            const tl = imgObj.range.tl
            const rowIdx = Math.floor(tl.row)
            const colIdx = Math.floor(tl.col)
            imageMap[`${rowIdx}_${colIdx}`] = imgSrc
          })
        }
      } catch {}

      if (data.length > 1) {
        const headers = data[0].map(h => h ? String(h).trim() : '')
        const validRows = []
        const skippedRows = []
        
        for (let i = 1; i < data.length; i++) {
          const rowArr = data[i]
          if (!rowArr || rowArr.length === 0 || rowArr.every(cell => !cell)) continue
          
          const rowObj = {}
          let missingFields = []
          
          headers.forEach((h, idx) => {
             if (h) {
                const val = rowArr[idx] !== undefined && rowArr[idx] !== null ? String(rowArr[idx]).trim() : ''
                const imgKey = `${i}_${idx}`
                rowObj[h] = imageMap[imgKey] || val
                if (!val && !imageMap[imgKey]) {
                   missingFields.push(h)
                }
             }
          })
          
          if (missingFields.length > 0) {
              skippedRows.push({
                row: i + 1,
                data: rowObj,
                reason: `Missing data for: ${missingFields.join(', ')}`,
                missingFields
              })
          } else {
             validRows.push({ ...rowObj, _rowNum: i + 1 })
          }
        }
        
        setExcelHeaders(headers.filter(h => h))
        setExcelData(validRows)
        setSkippedRecords(skippedRows)
        setIsEditMode(false)
        setSearchQuery('')
        setFilterColumn('')
        setCurrentPage(1)
      } else {
        setExcelHeaders([])
        setExcelData([])
        setSkippedRecords([])
        setIsEditMode(false)
        setSearchQuery('')
        setFilterColumn('')
        setCurrentPage(1)
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to parse Excel file')
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return

    setForm(f => ({ ...f, fileName: file.name }))

    const match = file.name.match(/\(([^)]+)\)/)
    if (match) {
      setForm(f => ({ ...f, modelNo: match[1] }))
    }

    const reader = new FileReader()
    reader.onload = (evt) => {
      const dataUrl = evt.target.result
      const base64 = dataUrl.split(',')[1]
      setFileContentBase64(base64)
      processExcelData(base64, 'base64')
    }
    reader.readAsDataURL(file)
  }

  const handleBrowseClick = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.selectFile()
        if (result) {
          setForm(f => ({ ...f, fileName: result.fileName }))
          const match = result.fileName.match(/\(([^)]+)\)/)
          if (match) {
            setForm(f => ({ ...f, modelNo: match[1] }))
          }
          setFileContentBase64(result.fileContentBase64)
          processExcelData(result.fileContentBase64, 'base64')
        }
      } catch (err) {
        toast.error('Failed to select file via Electron')
      }
    } else {
      fileInputRef.current?.click()
    }
  }

  const handleSkippedCellEdit = (index, header, newVal) => {
    setSkippedRecords(prev => prev.map((r, i) => {
      if (i === index) {
         const newData = { ...r.data, [header]: newVal }
         const missing = excelHeaders.filter(h => !newData[h])
         return {
           ...r,
           data: newData,
           missingFields: missing,
           reason: missing.length > 0 ? `Missing data for: ${missing.join(', ')}` : 'All issues fixed. Ready for download.'
         }
      }
      return r
    }))
  }

  const handleCellEdit = (rowNum, header, newVal, isSkipped) => {
    if (isSkipped) {
      setSkippedRecords(prev => prev.map(r => {
        if (r.row === rowNum) {
          const newData = { ...r.data, [header]: newVal }
          const missing = excelHeaders.filter(h => !newData[h])
          return {
            ...r,
            data: newData,
            missingFields: missing,
            reason: missing.length > 0 ? `Missing data for: ${missing.join(', ')}` : 'All issues fixed. Ready for download.'
          }
        }
        return r
      }))
    } else {
      setExcelData(prev => prev.map(r =>
        r._rowNum === rowNum ? { ...r, [header]: newVal } : r
      ))
    }
  }

  const handleDownloadFixedExcel = async (download = false) => {
    try {
      let workbook = new ExcelJS.Workbook();
      let worksheet;

      if (fileContentBase64) {
        const binaryStr = atob(fileContentBase64)
        const bytes = new Uint8Array(binaryStr.length)
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
        await workbook.xlsx.load(bytes.buffer)
        worksheet = workbook.worksheets[0]
        if (!worksheet) {
          toast.error('Failed to read original worksheet')
          return
        }
      } else {
        worksheet = workbook.addWorksheet('Sheet1')
        worksheet.addRow(excelHeaders)
      }

      // Build sorted list of edited rows
      const combined = []
      excelData.forEach(r => combined.push({ _rowNum: r._rowNum, data: r }))
      skippedRecords.forEach(r => combined.push({ _rowNum: r.row, data: r.data }))
      combined.sort((a, b) => a._rowNum - b._rowNum)

      // Map header names to column indices (1-based)
      const headerMap = {}
      if (fileContentBase64) {
        const headerRow = worksheet.getRow(1)
        headerRow.eachCell((cell, colNumber) => {
          if (cell.value) headerMap[String(cell.value).trim()] = colNumber
        })
      } else {
        excelHeaders.forEach((h, i) => headerMap[h] = i + 1)
      }

      // Update each row's cells with edited values
      combined.forEach(({ _rowNum, data }) => {
        const row = worksheet.getRow(_rowNum)
        excelHeaders.forEach((header) => {
          const colIdx = headerMap[header]
          if (colIdx && data[header] !== undefined) {
            const isImg = isImageHeader(header)
            if (isImg && typeof data[header] === 'string' && data[header].startsWith('data:image/')) {
              try {
                const base64Data = data[header].split(',')[1];
                const extension = data[header].split(';')[0].split('/')[1] || 'png';
                const imageId = workbook.addImage({
                  base64: base64Data,
                  extension: extension,
                });
                row.getCell(colIdx).value = '';
                worksheet.addImage(imageId, {
                  tl: { col: colIdx - 1, row: _rowNum - 1 },
                  br: { col: colIdx, row: _rowNum }
                });
              } catch (e) {
                console.error("Failed to embed image in Excel download", e)
              }
            } else {
              row.getCell(colIdx).value = data[header]
            }
          }
        })
        row.commit()
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      if (download) {
        const a = document.createElement('a')
        a.href = url
        a.download = form.fileName ? `Fixed_${form.fileName}` : "Fixed_Excel_Data.xlsx"
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        window.open(url, '_blank')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to generate fixed Excel file')
    }
  }

  const fetchModels = useCallback(async () => {
    try {
      const res = await api.get('/api/reference-master/Vehicle_Type')
      const models = (res.data?.data || []).map(r => r.description).filter(Boolean)
      setVehicleModels(models)
    } catch {
      setVehicleModels([])
    }
  }, [])

  const fetchIndices = useCallback(async () => {
    try {
      const res = await api.get('/api/index-creation')
      setIndices(res.data?.data || [])
    } catch {
      setIndices([])
    }
  }, [])

  useEffect(() => {
    fetchModels()
    fetchIndices()
  }, [fetchModels, fetchIndices])

  /* check for edit intent from IndexCreationReport */
  useEffect(() => {
    const editId = localStorage.getItem('velson:index-creation-edit')
    if (editId) {
      localStorage.removeItem('velson:index-creation-edit')
      loadForEdit(parseInt(editId, 10))
    } else {
      fetchNextNo()
    }
  }, [])

  const fetchNextNo = async () => {
    try {
      const res = await api.get('/api/index-creation/next-no')
      if (res.data?.success) {
        const next = res.data.nextNo
        setForm(f => ({ ...f, indexNo: String(next).padStart(3, '0') }))
      }
    } catch {}
  }

  const loadForEdit = async (id) => {
    try {
      const res = await api.get(`/api/index-creation/${id}`)
      if (res.data?.success) {
        const record = res.data.data
        setEditRecordId(record.id)
        setForm({
          date: record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0],
          indexNo: record.indexNo ? String(record.indexNo).padStart(3, '0') : '',
          model: record.model || '',
          modelNo: record.modelNo || '',
          fileLocation: record.fileLocation || '',
          fileName: record.fileName || ''
        })
        if (record.excelData?.excelData && Array.isArray(record.excelData.excelData)) {
          const ed = record.excelData.excelData.map((r, i) => ({ ...r, _rowNum: i + 2 }))
          setExcelData(ed)
          if (ed.length > 0) {
            setExcelHeaders(Object.keys(ed[0]).filter(k => k !== '_rowNum'))
          }
        }
        setImageFile(null)
        setDeleteImage(false)
        if (record.hasImage) {
          setImagePreview(`/api/index-creation/${record.id}/download-image`)
        } else {
          setImagePreview(null)
        }
        toast.success('Record loaded for editing')
      }
    } catch (err) {
      toast.error('Failed to load record for editing')
    }
  }

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (imagePreview && !imagePreview.startsWith('/api')) URL.revokeObjectURL(imagePreview)
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleClearImage = () => {
    if (imagePreview && !imagePreview.startsWith('/api')) URL.revokeObjectURL(imagePreview)
    setImageFile(null)
    setImagePreview(null)
    if (editRecordId) {
      setDeleteImage(true)
    }
  }

  const handleSave = async () => {
    if (!form.model || !form.modelNo) {
      toast.warning('Required: Model and Model No.')
      return
    }
    setIsSaving(true)
    try {
      const combined = []
      excelData.forEach(r => combined.push({ _rowNum: r._rowNum, ...r }))
      skippedRecords.forEach(r => combined.push({ _rowNum: r.row, ...r.data }))
      
      combined.sort((a, b) => a._rowNum - b._rowNum)
      
      const finalExcelData = combined.map(row => {
        const { _rowNum, ...cleanRow } = row
        return cleanRow
      })

      const payload = {
        date: form.date,
        model: form.model,
        modelNo: form.modelNo,
        fileLocation: form.fileLocation || null,
        fileName: form.fileName || null,
        fileContentBase64: fileContentBase64 || null,
        excelData: finalExcelData,
        createdBy: auth?.user?.name || 'Admin',
        updatedBy: auth?.user?.name || 'Admin'
      }

      if (editRecordId && deleteImage) {
        payload.imagePath = null
        payload.imageData = null
        payload.imageMimeType = null
      }

      let res
      if (editRecordId) {
        res = await api.put(`/api/index-creation/${editRecordId}`, payload)
      } else {
        res = await api.post('/api/index-creation', payload)
      }
      if (res.data?.success) {
        const indexId = editRecordId || res.data.data.id
        if (imageFile && indexId) {
          const fd = new FormData()
          fd.append('image', imageFile)
          fd.append('updatedBy', 'ADMIN')
          const upJson = await fetch(`/api/index-creation/${indexId}/upload`, {
            method: 'POST',
            body: fd,
          }).then(r => r.json())
          if (!upJson.success) console.warn('[IndexCreation] upload warning:', upJson.message)
        }

        toast.success(editRecordId ? 'Index Updated Successfully!' : 'Index Created Successfully!')
        handleReset()
        fetchIndices()
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save index')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split('T')[0],
      indexNo: '',
      model: '',
      modelNo: '',
      fileLocation: '',
      fileName: ''
    })
    setExcelData([])
    setExcelHeaders([])
    setSkippedRecords([])
    setFileContentBase64('')
    setImageFile(null)
    setImagePreview(null)
    setDeleteImage(false)
    setIsEditMode(false)
    setEditRecordId(null)
    setSearchQuery('')
    setFilterColumn('')
    setCurrentPage(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    fetchNextNo()
  }

  const deleteIdx = async (id) => {
    try {
      await api.delete(`/api/index-creation/${id}`)
      toast.success('Index deleted')
      fetchIndices()
    } catch {
      toast.error('Failed to delete index')
    }
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Index Creation</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">{editRecordId ? 'Edit BOM Index Master' : 'BOM Index Master'}</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleReset} className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <RotateCcw size={14} /> Reset
              </button>
              <button onClick={() => window.history.back()} className="text-slate-400 hover:text-red-600 transition-colors ml-2">
                <X size={20} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-12 gap-10">
              {/* Left Column: Form Fields */}
              <div className="col-span-6">
                <div className="space-y-5 bg-slate-50/30 p-6 rounded-2xl border border-slate-100 shadow-inner">
                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label>Creation Date</Label></div>
                    <div className="col-span-4"><Input type="date" value={form.date} readOnly /></div>
                    <div className="col-span-2 text-right"><Label>ID No</Label></div>
                    <div className="col-span-3"><Input value={form.indexNo} readOnly className="!font-black text-[#0097A7] !bg-white text-center tracking-widest" /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label required>Model</Label></div>
                    <div className="col-span-9">
                      <Select
                        options={vehicleModels}
                        value={form.model}
                        onChange={u('model')}
                        placeholder="--- Select Primary Model ---"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label required>Model No</Label></div>
                    <div className="col-span-9"><Input placeholder="Enter Model Serial Number..." value={form.modelNo} onChange={u('modelNo')} /></div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label>File Name & Location</Label></div>
                    <div className="col-span-9">
                      <Input placeholder="Index_V1.xlsx" value={form.fileName} onChange={u('fileName')} />
                    </div>
                  </div>

                  <div className="grid grid-cols-12 items-center gap-4">
                    <div className="col-span-3"><Label>Excel Sheet number</Label></div>
                    <div className="col-span-9">
                      <Input placeholder="1" value={form.fileLocation} readOnly onChange={u('fileLocation')} />
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-slate-100">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".xlsx, .xls" className="hidden" />
                    <button type="button" onClick={handleBrowseClick} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[13px] font-bold rounded-xl transition-all shadow-sm active:scale-95">
                      <Search size={18} className="text-[#0097A7]" /> Browse
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                    >
                    {isSaving ? <RotateCcw size={18} className="animate-spin" /> : <Save size={18} />}
                    {isSaving ? 'Saving...' : editRecordId ? 'Update Index' : 'Save Index'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Visualization */}
              <div className="col-span-6">
                <div className="border border-slate-200 rounded-lg bg-slate-50 min-h-[393px] flex flex-col items-center justify-center p-6 relative">
                  {imagePreview ? (
                    <div className="w-full h-full flex flex-col items-center justify-center">
                      <div className="relative w-full max-w-[400px] aspect-[16/10] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex items-center justify-center">
                        <img src={imagePreview} alt="preview" className="w-full h-full object-contain" />
                        <button
                          type="button"
                          onClick={handleClearImage}
                          className="absolute top-3 right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md transition-colors z-10 active:scale-95"
                          title="Remove image"
                        >
                          ✕
                        </button>
                      </div>
                      <p className="mt-3 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Model Image Preview
                      </p>
                      <p className="mt-1 text-[13px] font-semibold text-slate-700">
                        {form.modelNo || "No Model Selected"}
                      </p>
                    </div>
                  ) : (
                    <label className="w-full max-w-[400px] aspect-[16/10] border-2 border-dashed border-slate-300 hover:border-[#0097A7] rounded-xl flex flex-col items-center justify-center cursor-pointer bg-white/50 hover:bg-[#0097A7]/5 transition-all group p-4 text-center">
                      <ImageIcon
                        size={48}
                        strokeWidth={1.5}
                        className="text-slate-400 group-hover:text-[#0097A7] mb-3 transition-colors"
                      />
                      <p className="text-[13px] font-semibold text-slate-655">
                        Upload Model Image
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Click or drag image file here (PNG, JPG)
                      </p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Table Section */}
            {allRows.length > 0 && (
              <div className="mt-12">
                <div className="space-y-3 px-2 mb-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2 whitespace-nowrap">
                      <div className="w-3 h-3 bg-red-700 rounded-full" />
                      Excel Data Preview
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      {isEditMode ? (
                        <>
                          <button 
                            onClick={() => {
                              if (backupData) {
                                setExcelData(backupData.excelData)
                                setSkippedRecords(backupData.skippedRecords)
                              }
                              setIsEditMode(false)
                              setBackupData(null)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 border text-[11px] font-bold rounded-lg transition-all shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          >
                            Exit Edit Mode
                          </button>
                          <button 
                            onClick={() => {
                              setIsEditMode(false)
                              setBackupData(null)
                            }}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 border text-[11px] font-bold rounded-lg transition-all shadow-sm bg-slate-700 text-white border-slate-700 hover:bg-slate-800"
                          >
                            Save
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => {
                            setBackupData({
                              excelData: JSON.parse(JSON.stringify(excelData)),
                              skippedRecords: JSON.parse(JSON.stringify(skippedRecords))
                            })
                            setIsEditMode(true)
                          }}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 border text-[11px] font-bold rounded-lg transition-all shadow-sm bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        >
                          Enter Edit Mode
                        </button>
                      )}
                      {isEditMode && (
                        <button 
                          onClick={() => setShowSkippedOnly(!showSkippedOnly)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 border text-[11px] font-bold rounded-lg transition-all shadow-sm ${showSkippedOnly ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                        >
                          <FileSpreadsheet size={14} /> {showSkippedOnly ? 'Show All' : `Skipped Records (${skippedRecords.length})`}
                        </button>
                      )}
                      <button 
                        onClick={() => handleDownloadFixedExcel(false)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                        title="View Excel"
                      >
                        <FileSpreadsheet size={14} /> View Excel
                      </button>
                      <button 
                        onClick={() => handleDownloadFixedExcel(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                        title="Download Excel"
                      >
                        <Download size={14} /> Download Excel
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold text-slate-500">Rows per page:</span>
                      <select 
                        value={rowsPerPage} 
                        onChange={e => setRowsPerPage(Number(e.target.value))}
                        className="px-2 py-1.5 text-[12px] font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-[#0097A7] text-slate-700 bg-white cursor-pointer"
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                        <option value={allRows.length}>All</option>
                      </select>
                    </div>
                    <div className="h-5 w-px bg-slate-200" />
                    <select 
                      value={filterColumn} 
                      onChange={e => setFilterColumn(e.target.value)}
                      className="px-3 py-1.5 text-[12px] font-bold border border-slate-200 rounded-lg focus:outline-none focus:border-[#0097A7] text-slate-700 bg-white min-w-[120px] cursor-pointer"
                    >
                      <option value="">All Columns</option>
                      {excelHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search data..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-[12px] font-medium border border-slate-200 rounded-lg focus:outline-none focus:border-[#0097A7] focus:ring-1 focus:ring-[#0097A7] w-64 bg-white"
                      />
                    </div>
                  </div>
                </div>
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#fcfdfe] text-[11px] uppercase text-slate-500 font-black border-b border-slate-200 whitespace-nowrap">
                      <tr>
                        <th className="px-6 py-4 border-r border-slate-100 w-16 text-center">#</th>
                        {excelHeaders.map(header => (
                          <th key={header} className="px-6 py-4 border-r border-slate-100">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-[13px]">
                      {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors h-16 group">
                          <td className="px-6 py-3 border-r border-slate-50 text-center text-slate-400 font-bold">
                            {(currentPage - 1) * rowsPerPage + idx + 1}
                          </td>
                          {excelHeaders.map(header => {
                            const isImg = isImageHeader(header)
                            if (isImg) {
                              const imgSrc = resolveImageSrc(row[header])
                              return (
                                <td key={header} className="px-6 py-3 border-r border-slate-50 text-center align-middle">
                                  {imgSrc ? (
                                    <div 
                                      className="w-20 h-20 rounded border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center justify-center shadow-sm"
                                      onClick={() => setViewPopupImage(row[header])}
                                    >
                                      <img src={imgSrc} alt="preview" className="w-full h-full object-contain" />
                                    </div>
                                  ) : row[header] ? (
                                    <span className="text-slate-655 text-xs font-semibold bg-slate-100 px-2 py-1 rounded border border-slate-200 truncate max-w-[120px] inline-block shadow-inner" title={row[header]}>
                                      📄 {row[header]}
                                    </span>
                                  ) : isEditMode ? (
                                    <label className="inline-flex items-center justify-center w-8 h-8 rounded bg-slate-100 hover:bg-[#0097A7] text-slate-400 hover:text-white cursor-pointer transition-colors shadow-sm">
                                      <Upload size={14} />
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={(e) => {
                                          const file = e.target.files[0]
                                          if (file) {
                                            const reader = new FileReader()
                                            reader.onload = (evt) => {
                                              handleCellEdit(row._rowNum, header, evt.target.result, row._isSkipped)
                                            }
                                            reader.readAsDataURL(file)
                                          }
                                        }}
                                      />
                                    </label>
                                  ) : (
                                    <span className="text-slate-300 italic">—</span>
                                  )}
                                </td>
                              )
                            }
                            return (
                              <td 
                                key={header} 
                                className={`px-6 py-3 border-r border-slate-50 font-medium whitespace-nowrap ${!row[header] ? 'bg-rose-50/80 text-slate-400' : 'text-slate-800'} ${isEditMode ? 'hover:bg-slate-50 cursor-text outline-none focus:bg-white focus:ring-2 focus:ring-[#0097A7]/40 focus:ring-inset' : ''}`}
                                contentEditable={isEditMode}
                                suppressContentEditableWarning
                                onBlur={(e) => handleCellEdit(row._rowNum, header, e.target.textContent, row._isSkipped)}
                              >
                                {row[header] || ''}
                              </td>
                            )
                          })}
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={excelHeaders.length + 1} className="px-6 py-12 text-center text-slate-500 font-medium bg-slate-50/50">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <Search size={24} className="text-slate-300" />
                              <p>No matching data found.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-2 mt-4">
                    <p className="text-[12px] font-medium text-slate-500">
                      Showing <span className="font-bold text-slate-700">{(currentPage - 1) * rowsPerPage + 1}</span> to <span className="font-bold text-slate-700">{Math.min(currentPage * rowsPerPage, filteredData.length)}</span> of <span className="font-bold text-slate-700">{filteredData.length}</span> entries
                    </p>
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3.5 py-1.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:hover:bg-white"
                      >
                        Prev
                      </button>
                      <div className="flex items-center gap-1 mx-2">
                        <span className="text-[12px] font-bold text-slate-700">Page {currentPage}</span>
                        <span className="text-[12px] font-medium text-slate-500">of {totalPages}</span>
                      </div>
                      <button 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-3.5 py-1.5 text-[12px] font-bold text-slate-600 bg-white border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors disabled:hover:bg-white"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
      {viewPopupImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewPopupImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setViewPopupImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors z-10"
            >
              ✕
            </button>
            <img 
              src={viewPopupImage.startsWith('data:') ? viewPopupImage : `data:image/png;base64,${viewPopupImage}`} 
              alt="full size preview" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}
