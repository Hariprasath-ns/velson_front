import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'
import { useState, useEffect, useCallback, Fragment } from 'react'
import api from '../services/api'
import {
  ChevronRight, Search, Printer, X, Download,
  FileSpreadsheet, FileJson, Image as ImageIcon, RotateCcw,
  Edit, Trash2, Info, Loader2, Eye
} from 'lucide-react'
import { useToast } from '../components/Toast'
import ConfirmDialog from '../components/ConfirmDialog'

const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ placeholder, value, onChange, type = 'text', className = "" }) => (
  <input
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
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
  return (
    lower.includes('image') ||
    lower.includes('diagram') ||
    lower.includes('pic') ||
    lower.includes('photo') ||
    lower.includes('drawing') ||
    lower.includes('illustration') ||
    lower.includes('logo') ||
    lower.includes('thumbnail') ||
    lower.includes('graphic')
  )
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

const reorderHeaders = (headers) => {
  if (!headers || !headers.length) return [];
  
  // Find Part No header
  const partNoHeader = headers.find(h => {
    const l = h.toLowerCase();
    return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno' || l === 'part_no';
  });

  // Find Part Name header
  const partNameHeader = headers.find(h => {
    const l = h.toLowerCase();
    return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description') || l === 'partname' || l === 'part_name';
  });

  // Find Image header
  const imageHeader = headers.find(h => {
    const l = h.toLowerCase();
    return (
      l.includes('image') ||
      l.includes('diagram') ||
      l.includes('pic') ||
      l.includes('photo') ||
      l.includes('drawing') ||
      l.includes('illustration') ||
      l.includes('logo') ||
      l.includes('thumbnail') ||
      l.includes('graphic')
    );
  });

  // Find UOM header
  const uomHeader = headers.find(h => {
    const l = h.toLowerCase();
    return l.includes('uom') || l === 'unit' || l.includes('unit of measure') || l === 'measure' || l === 'units';
  });

  const ordered = [];
  if (partNoHeader) ordered.push(partNoHeader);
  if (partNameHeader) ordered.push(partNameHeader);
  if (imageHeader) ordered.push(imageHeader);
  if (uomHeader) ordered.push(uomHeader);

  // Add the remaining headers in their original order
  headers.forEach(h => {
    if (h !== partNoHeader && h !== partNameHeader && h !== imageHeader && h !== uomHeader) {
      ordered.push(h);
    }
  });

  return ordered;
};

const isPartNameHeader = (h) => {
  if (!h) return false;
  const l = h.toLowerCase();
  return l.includes('part name') || l.includes('name') || l.includes('desc') || l.includes('description') || l === 'partname' || l === 'part_name';
};

const isPartNoHeader = (h) => {
  if (!h) return false;
  const l = h.toLowerCase();
  return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno' || l === 'part_no';
};

const isUOMHeader = (h) => {
  if (!h) return false;
  const l = h.toLowerCase();
  return l.includes('uom') || l === 'unit' || l.includes('unit of measure') || l === 'measure' || l === 'units';
};


export default function IndexCreationReport() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [modelName, setModelName] = useState('')
  const [modelNo, setModelNo] = useState('')
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [detailRow, setDetailRow] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedRow, setExpandedRow] = useState(null)
  const [reportPopupImage, setReportPopupImage] = useState(null)
  const [viewModelImage, setViewModelImage] = useState(null)
  const [hoverImage, setHoverImage] = useState(null) // { src, x, y }


  const fetchIndices = useCallback(async () => {
    try {
      const res = await api.get(`/api/index-creation?_t=${Date.now()}`)
      const records = res.data?.data || []
      setData(records)
      setFilteredData(records)
    } catch {
      setData([])
      setFilteredData([])
    }
  }, [])

  useEffect(() => {
    fetchIndices()
  }, [fetchIndices])

  const handleSearch = () => {
    setSearching(true)
    setTimeout(() => {
      const start = new Date(fromDate)
      const end = new Date(toDate)
      end.setHours(23, 59, 59, 999)
      const result = data.filter(r => {
        const d = new Date(r.date)
        const dateMatch = (!fromDate || d >= start) && (!toDate || d <= end)
        const modelMatch = modelName ? (r.model || '').toLowerCase() === modelName.toLowerCase() : true
        const modelNoMatch = modelNo ? (r.modelNo || '').toLowerCase().includes(modelNo.toLowerCase()) : true
        return dateMatch && modelMatch && modelNoMatch
      })
      setFilteredData(result)
      setSearching(false)
    }, 300)
  }

      // Helper to resolve and convert images to base64 for Excel embedding
const getBase64Image = async (imgSource) => {
  if (!imgSource || typeof imgSource !== 'string') return null;
  const trimmed = imgSource.trim();
  
  if (trimmed.startsWith('data:image/')) {
    const parts = trimmed.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const extension = mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : 'png';
    return { base64: parts[1], extension };
  }

  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 64) {
    return { base64: trimmed, extension: 'png' };
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/api/') || trimmed.startsWith('/uploads/')) {
    try {
      const res = await api.get(trimmed, { responseType: 'blob', skipGlobalLoader: true });
      const blob = res.data;
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const resStr = reader.result;
          if (typeof resStr === 'string' && resStr.startsWith('data:image/')) {
            const parts = resStr.split(',');
            const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
            const extension = mime.includes('jpeg') || mime.includes('jpg') ? 'jpeg' : 'png';
            resolve({ base64: parts[1], extension });
          } else {
            resolve(null);
          }
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  }

  return null;
};

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning('No records to export.')
      return
    }

    toast.info('Generating Excel file with images...')

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Index_Report')

      // Set column widths
      worksheet.columns = [
        { key: 'sno', width: 8 },
        { key: 'partName', width: 34 },
        { key: 'image', width: 14 },
        { key: 'qty', width: 10 },
        { key: 'partNo', width: 22 },
        { key: 'date', width: 16 },
        { key: 'remarks', width: 28 },
      ]

      let currentRowIdx = 1

      for (const r of filteredData) {
        const raw = r.excelData
        const items = Array.isArray(raw) ? raw : (raw?.excelData || [])
        const dStr = r.date ? r.date.split('T')[0] : '—'

        // 1. Model Header Row
        const modelRow = worksheet.getRow(currentRowIdx)
        modelRow.values = [`Model: ${r.model || '—'}`, '', `Model No: ${r.modelNo || '—'}`]
        modelRow.font = { bold: true, size: 12, color: { argb: 'FF0F172A' } }
        modelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        }
        modelRow.height = 24
        currentRowIdx++

        // 2. Table Column Headers
        const headerRow = worksheet.getRow(currentRowIdx)
        headerRow.values = ['S.No', 'Part Name', 'Image', 'Qty', 'Part No', 'Date', 'Remarks']
        headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
        headerRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0097A7' }
        }
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
        headerRow.height = 22

        headerRow.eachCell((cell, colNum) => {
          if (colNum === 2 || colNum === 5 || colNum === 7) {
            cell.alignment = { vertical: 'middle', horizontal: 'left' }
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF007A87' } },
            left: { style: 'thin', color: { argb: 'FF007A87' } },
            bottom: { style: 'thin', color: { argb: 'FF007A87' } },
            right: { style: 'thin', color: { argb: 'FF007A87' } }
          }
        })
        currentRowIdx++

        // 3. Data Rows
        if (items.length === 0) {
          const dataRow = worksheet.getRow(currentRowIdx)
          dataRow.values = [1, '—', '', 1, '—', dStr, r.remarks || '—']
          dataRow.alignment = { vertical: 'middle' }
          dataRow.height = 22
          dataRow.eachCell((cell) => {
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
              right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
            }
          })
          currentRowIdx++
        } else {
          for (let i = 0; i < items.length; i++) {
            const it = items[i]
            const partName = it.PartName || it['Part Name'] || it.partName || it.Name || '—'
            const partNo = it.PartNo || it['Part No'] || it.partNo || it['Part Number'] || '—'
            const qty = it.Qty || it.qty || 1
            const rawImg = it.Image || it.image || it.Pic || it.pic
            const remarks = it.Remarks || it.remarks || r.remarks || '—'

            const dataRow = worksheet.getRow(currentRowIdx)
            dataRow.values = [i + 1, partName, '', qty, partNo, dStr, remarks]
            dataRow.alignment = { vertical: 'middle' }
            dataRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
            dataRow.getCell(4).alignment = { vertical: 'middle', horizontal: 'center' }
            dataRow.getCell(5).font = { bold: true, color: { argb: 'FF0097A7' } }

            dataRow.height = rawImg ? 50 : 24

            dataRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              if (colNumber <= 7) {
                cell.border = {
                  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                  right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                }
              }
            })

            // Embed Image
            if (rawImg) {
              const imgData = await getBase64Image(rawImg)
              if (imgData) {
                try {
                  const imageId = workbook.addImage({
                    base64: imgData.base64,
                    extension: imgData.extension
                  })
                  worksheet.addImage(imageId, {
                    tl: { col: 2.1, row: currentRowIdx - 0.9 },
                    ext: { width: 55, height: 42 },
                    editAs: 'oneCell'
                  })
                } catch (imgErr) {
                  console.warn('Failed to embed image in Excel:', imgErr)
                }
              }
            }

            currentRowIdx++
          }
        }

        // Empty row separation between models
        currentRowIdx++
      }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Index_Creation_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Index Creation Report with images exported to Excel successfully!')
    } catch (err) {
      console.error('Failed to export Excel with images:', err)
      toast.error('Failed to generate Excel file.')
    }
  };

const handlePrintStandardReport = () => {
    if (filteredData.length === 0) {
      toast.warning('No records to print')
      return
    }

    const printWindow = window.open('', '_blank', 'width=1100,height=800')
    let sectionsHtml = ''

    filteredData.forEach(r => {
      const raw = r.excelData
      const items = Array.isArray(raw) ? raw : (raw?.excelData || [])
      const dStr = r.date ? r.date.split('T')[0] : '—'

      let rowsHtml = ''
      if (items.length === 0) {
        rowsHtml += `
          <tr>
            <td style="text-align:center;">1</td>
            <td>—</td>
            <td style="text-align:center;">—</td>
            <td style="text-align:center;">1</td>
            <td style="font-weight:bold;color:#0097A7;">—</td>
            <td>${dStr}</td>
            <td>${r.remarks || '—'}</td>
          </tr>
        `
      } else {
        items.forEach((it, idx) => {
          const partName = it.PartName || it['Part Name'] || it.partName || it.Name || '—'
          const partNo = it.PartNo || it['Part No'] || it.partNo || it['Part Number'] || '—'
          const qty = it.Qty || it.qty || 1
          const imgVal = resolveImageSrc(it.Image || it.image || it.Pic || it.pic)
          const imgTag = imgVal ? `<img src="${imgVal}" style="max-height:40px;max-width:50px;object-fit:contain;" />` : '—'
          const remarks = it.Remarks || it.remarks || r.remarks || '—'

          rowsHtml += `
            <tr>
              <td style="text-align:center;">${idx + 1}</td>
              <td>${partName}</td>
              <td style="text-align:center;">${imgTag}</td>
              <td style="text-align:center;">${qty}</td>
              <td style="font-weight:bold;color:#0097A7;">${partNo}</td>
              <td>${dStr}</td>
              <td>${remarks}</td>
            </tr>
          `
        })
      }

      sectionsHtml += `
        <div class="model-section" style="margin-bottom: 24px; page-break-inside: avoid;">
          <div style="background: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; display: flex; gap: 32px; font-size: 12px;">
            <div><strong style="color: #475569;">Model:</strong> <span style="font-weight: bold; color: #0f172a;">${r.model || '—'}</span></div>
            <div><strong style="color: #475569;">Model No:</strong> <span style="font-weight: bold; color: #0097A7;">${r.modelNo || '—'}</span></div>
          </div>
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="width:6%;text-align:center;">S.No</th>
                <th style="width:28%;">Part Name</th>
                <th style="width:12%;text-align:center;">Image</th>
                <th style="width:6%;text-align:center;">Qty</th>
                <th style="width:18%;">Part No</th>
                <th style="width:12%;">Date</th>
                <th style="width:18%;">Remarks</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      `
    })

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Index Creation Report</title>
          <style>
            @page { size: A4 landscape; margin: 10mm; }
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; color: #333; }
            .header { border-bottom: 2px solid #0097A7; padding-bottom: 8px; margin-bottom: 14px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; color: #0097A7; font-size: 18px; font-weight: bold; }
            .header p { margin: 2px 0 0; color: #666; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { background: #0097A7; color: #fff; font-size: 10px; text-transform: uppercase; padding: 6px 4px; border: 1px solid #007a87; text-align: left; }
            td { padding: 5px 4px; border: 1px solid #cbd5e1; font-size: 10.5px; vertical-align: middle; }
            tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>VELSON ERP - INDEX CREATION REPORT</h1>
              <p>Standard Model & Part Breakdown Registry</p>
            </div>
            <div style="text-align:right;">
              <p>Generated: ${new Date().toLocaleDateString()} | Total Models: ${filteredData.length}</p>
            </div>
          </div>
          ${sectionsHtml}
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    setDeleting(true)
    try {
      await api.delete(`/api/index-creation/${confirmDelete}`)
      toast.success('Index deleted.')
      setConfirmDelete(null)
      setData(prev => prev.filter(r => r.id !== confirmDelete))
      setFilteredData(prev => prev.filter(r => r.id !== confirmDelete))
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to delete index.')
    } finally {
      setDeleting(false)
    }
  }

  const expandedRowData = expandedRow ? filteredData.find(r => r.id === expandedRow) : null

  const handleEdit = row => {
    localStorage.setItem('velson:index-creation-edit', String(row.id))
    window.dispatchEvent(new CustomEvent('velson:navigate', { detail: { page: 'IndexCreation' } }))
  }

  const handleDeleteConfirm = id => setConfirmDelete(id)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Index Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Index Creation Registry</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handleExportExcel} className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95">
                <FileSpreadsheet size={16} /> Export Excel
              </button>
              <button onClick={handlePrintStandardReport} className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm">
                <Printer size={16} /> Print Report (PDF)
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-black rounded-lg transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-12 gap-8 mb-8 bg-slate-50/50 p-6 rounded-2xl border border-slate-100 items-center">
              <div className="col-span-8 space-y-4">
                <div className="flex items-center gap-8 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Label>From Date :</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>To Date :</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40 shadow-sm" />
                  </div>
                  <button
                    onClick={handleSearch}
                    className="flex items-center gap-2 px-8 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded shadow-md transition-all active:scale-95 whitespace-nowrap"
                  >
                    {searching ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
                    Search
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-2"><Label>Model Name :</Label></div>
                  <div className="col-span-4">
                    <Select
                      options={Array.from(new Set(data.map(r => r.model).filter(Boolean)))}
                      placeholder="--- All Models ---"
                      value={modelName}
                      onChange={e => setModelName(e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 text-right"><Label>Model No :</Label></div>
                  <div className="col-span-4">
                    <Input
                      placeholder="Search Model No..."
                      value={modelNo}
                      onChange={e => setModelNo(e.target.value)}
                      className="shadow-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-12 gap-4 items-center pt-3">
                  <div className="col-span-2"><Label>Actions :</Label></div>
                  <div className="col-span-10 flex items-center gap-3">
                    <button
                      onClick={() => expandedRowData && setDetailRow(expandedRowData)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg border border-slate-200 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Eye size={15} /> View
                    </button>
                    <button
                      onClick={() => expandedRowData && handleEdit(expandedRowData)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Edit size={15} /> Edit
                    </button>
                    <button
                      onClick={() => expandedRowData && handleDeleteConfirm(expandedRowData.id)}
                      disabled={!expandedRowData}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[12px] font-bold rounded-lg transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8">
                {expandedRowData ? (
                  expandedRowData.hasImage ? (
                    <div className="text-center w-full">
                      <div
                        className="w-full max-w-[260px] aspect-square bg-white border border-slate-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-md bg-slate-50 cursor-pointer hover:shadow-lg hover:border-[#0097A7]/40 transition-all duration-200 mx-auto"
                        onClick={() => setViewModelImage(`/api/index-creation/${expandedRowData.id}/download-image`)}
                      >
                        <img
                          src={`/api/index-creation/${expandedRowData.id}/download-image`}
                          alt="Model Preview"
                          className="w-full h-full object-contain p-2"
                        />
                      </div>
                      <p className="text-[12px] font-black text-[#0097A7] mt-4 uppercase tracking-widest">
                        {expandedRowData.modelNo}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center group">
                      <div className="w-36 h-36 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-300">
                        <ImageIcon size={52} />
                      </div>
                      <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">No Image</p>
                    </div>
                  )
                ) : (
                  <div className="text-center group cursor-pointer">
                    <div className="w-36 h-36 bg-white border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center text-slate-200 group-hover:border-[#0097A7] group-hover:text-[#0097A7] transition-all">
                      <ImageIcon size={52} />
                    </div>
                    <p className="text-[11px] font-black text-slate-400 mt-3 uppercase tracking-widest">Select record</p>
                  </div>
                )}
              </div>
            </div>



            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse min-w-[1000px] table-fixed">
                <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 border-r border-slate-100 w-16 text-center">S.No</th>
                    <th className="px-5 py-4 border-r border-slate-100 w-28">Index No</th>
                    <th className="px-5 py-4 border-r border-slate-100 w-[250px]">Model Name</th>
                    <th className="px-5 py-4 border-r border-slate-100 w-[200px]">Model No</th>
                    <th className="px-5 py-4 border-r border-slate-100 w-[200px]">Creation By</th>
                    <th className="px-5 py-4 border-r border-slate-100 w-[180px]">Creation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[12.5px]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-20 text-center text-slate-300 italic text-sm">
                        No records match the current filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <Fragment key={row.id}>
                        <tr 
                          onClick={() => setExpandedRow(expandedRow === row.id ? null : row.id)} 
                          className="hover:bg-[#0097A7]/5 transition-colors h-14 group cursor-pointer"
                        >
                          <td className="px-5 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-black text-[#0097A7] uppercase">{String(row.indexNo).padStart(3, '0')}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-700 truncate" title={row.model}>{row.model}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-medium text-slate-600 truncate" title={row.modelNo}>{row.modelNo}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-medium text-slate-600 truncate" title={row.createdBy || ''}>{row.createdBy || '—'}</td>
                          <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-bold whitespace-nowrap">{row.date?.split('T')[0] || row.date}</td>
                        </tr>
                        {expandedRow === row.id && (
                          <tr>
                            <td colSpan={6} className="p-0 border-b border-slate-200">
                              <div className="bg-slate-50/80 p-6 shadow-inner border-t border-slate-200 overflow-x-auto">
                                <h4 className="text-[12px] font-black text-slate-700 mb-3 uppercase tracking-wider flex items-center gap-2">
                                  <FileSpreadsheet size={16} className="text-[#0097A7]" /> Excel Data Preview
                                </h4>
                                {(() => {
                                  const raw = row.excelData;
                                  const excelRows = raw && Array.isArray(raw)
                                    ? raw
                                    : raw && raw.excelData && Array.isArray(raw.excelData)
                                      ? raw.excelData
                                      : null;
                                  return excelRows && excelRows.length > 0 ? (
                                  <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                                    <table className="w-full text-left border-collapse table-fixed">
                                      <thead className="bg-[#fcfdfe] text-[10px] uppercase text-slate-400 font-black border-b border-slate-200">
                                        <tr>
                                           {reorderHeaders(Object.keys(excelRows[0] || {}).filter(k => k !== '_rowNum')).map(header => {
                                             const isPartName = isPartNameHeader(header);
                                             const isPartNo = isPartNoHeader(header);
                                             const isImg = isImageHeader(header);
                                             const isUom = isUOMHeader(header);
                                             let widthClass = "w-[150px]";
                                             if (isPartNo) widthClass = "w-[160px]";
                                             else if (isPartName) widthClass = "w-[280px]";
                                             else if (isImg) widthClass = "w-[120px]";
                                             else if (isUom) widthClass = "w-[100px]";
                                             return (
                                               <th 
                                                 key={header} 
                                                 className={`px-4 py-3 border-r border-slate-100 ${widthClass} ${isPartName ? 'max-w-[200px] truncate' : ''}`}
                                                 title={isPartName ? header : undefined}
                                               >
                                                 {header}
                                               </th>
                                             );
                                           })}
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600 font-medium">
                                        {excelRows.map((exRow, i) => (
                                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                                               {reorderHeaders(Object.keys(excelRows[0] || {}).filter(k => k !== '_rowNum')).map(k => {
                                                const isImg = isImageHeader(k) || !!resolveImageSrc(exRow[k]);
                                                if (isImg) {
                                                  const imgSrc = resolveImageSrc(exRow[k]);
                                                  return (
                                                    <td key={k} className="px-4 py-1.5 border-r border-slate-50 text-center align-middle">
                                                      {imgSrc ? (
                                                        <div className="flex items-center justify-center">
                                                          <div 
                                                            className="w-20 h-20 rounded border border-slate-200 overflow-hidden bg-slate-50 cursor-pointer hover:opacity-85 transition-opacity inline-flex items-center justify-center shadow-sm"
                                                            onMouseEnter={e => {
                                                              const r = e.currentTarget.getBoundingClientRect()
                                                              setHoverImage({ src: imgSrc, x: r.left + r.width / 2, y: r.top })
                                                            }}
                                                            onMouseLeave={() => setHoverImage(null)}
                                                            onClick={() => setReportPopupImage(imgSrc)}
                                                          >
                                                            <img src={imgSrc} alt="preview" className="w-full h-full object-contain" />
                                                          </div>
                                                        </div>
                                                      ) : exRow[k] ? (
                                                        <span className="text-slate-655 text-[10px] font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 truncate max-w-[100px] inline-block shadow-inner" title={exRow[k]}>
                                                          📄 {exRow[k]}
                                                        </span>
                                                      ) : (
                                                        <span className="text-slate-300 italic">—</span>
                                                      )}
                                                    </td>
                                                  )
                                                }
                                               const isPartName = isPartNameHeader(k);
                                               return (
                                                 <td 
                                                   key={k} 
                                                   className={`px-4 py-2 border-r border-slate-50 whitespace-nowrap truncate ${isPartName ? 'max-w-[200px]' : ''}`}
                                                   title={exRow[k] || ''}
                                                 >
                                                   {exRow[k] || ''}
                                                 </td>
                                               )
                                            })}
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <p className="text-sm text-slate-400 italic font-medium">No Excel data available for this model.</p>
                                );})()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center justify-between bg-white border border-slate-200 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-slate-600">
                  Total Entries :
                </span>
                <span className="text-[13px] font-semibold text-slate-800">
                  {filteredData.length}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {detailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setDetailRow(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <Info size={16} className="text-[#0097A7]" />
                Index Details
              </h3>
              <button onClick={() => setDetailRow(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-[13px]">
              {detailRow.hasImage && (
                <div className="flex justify-center mb-4">
                  <div
                    className="w-full max-w-[320px] aspect-[4/3] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-md flex items-center justify-center p-2 cursor-pointer hover:shadow-lg hover:border-[#0097A7]/40 transition-all duration-200"
                    onClick={() => setViewModelImage(`/api/index-creation/${detailRow.id}/download-image`)}
                  >
                    <img
                      src={`/api/index-creation/${detailRow.id}/download-image`}
                      alt="Model Preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              )}
              {[
                ['Index No', detailRow.indexNo],
                ['Model', detailRow.model],
                ['Model No', detailRow.modelNo],
                ['Creation Date', detailRow.date?.split('T')[0] || detailRow.date],
                ['Excel Sheet Number', detailRow.fileLocation || '—'],
                ['File Name', detailRow.fileName || '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center border-b border-slate-50 pb-2">
                  <span className="w-36 font-semibold text-slate-500 text-[12px] uppercase tracking-wider">{label}</span>
                  <span className="font-medium text-slate-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm Delete"
        message="Delete this index record? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(null)}
      />

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

      {reportPopupImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setReportPopupImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setReportPopupImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors z-10"
            >
              ✕
            </button>
            <img 
              src={reportPopupImage.startsWith('data:') ? reportPopupImage : `data:image/png;base64,${reportPopupImage}`} 
              alt="full size preview" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}

      {viewModelImage && (
        <div 
          className="fixed inset-0 z-[10000] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setViewModelImage(null)}
        >
          <div 
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg p-2 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setViewModelImage(null)}
              className="absolute top-3 right-3 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md transition-colors z-10"
            >
              ✕
            </button>
            <img 
              src={viewModelImage} 
              alt="Model full size preview" 
              className="max-w-full max-h-[80vh] object-contain rounded"
            />
          </div>
        </div>
      )}
    </div>
  )
}
