import { useState, useEffect, useMemo, Fragment } from 'react'
import {
  ChevronRight, Search, Printer, X, Trash2, Download,
  FileSpreadsheet, FileJson, Filter, Settings, Image as ImageIcon, RotateCcw, List, FileText, ChevronDown
} from 'lucide-react'
import api from '../services/api'
import { jsPDF } from 'jspdf'
import ExcelJS from 'exceljs'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../components/Toast'

// ── Shared UI primitives ──
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

const Select = ({ options, placeholder, value, onChange, className = "", disabled = false }) => (
  <div className={`relative ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`w-full px-3 py-[7px] pr-8 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 appearance-none focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <option value="">{placeholder}</option>
      {options.map(o => {
        const val = typeof o === 'object' ? o.value : o;
        const lbl = typeof o === 'object' ? o.label : o;
        return <option key={val} value={val}>{lbl}</option>;
      })}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

export default function BOMCreationReport() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [customer, setCustomer] = useState('')
  const [serialNo, setSerialNo] = useState('')
  const [assemblyPartNo, setAssemblyPartNo] = useState('')
  const [vehicles, setVehicles] = useState([])
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedPartImage, setSelectedPartImage] = useState(null)
  const [expandedBomId, setExpandedBomId] = useState(null)
  const [selectedChildRow, setSelectedChildRow] = useState(null)
  const [lightboxImage, setLightboxImage] = useState(null)

  useEffect(() => {
    setSelectedChildRow(null)
  }, [expandedBomId])

  const fetchBoms = async () => {
    try {
      const res = await api.get('/api/bom-creation')
      const boms = res.data?.data || []
      setData(boms)
      setFilteredData(boms)
    } catch (err) {
      console.error('Error fetching BOMs', err)
    }
  }

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/api/vehicle-master')
      setVehicles(res.data?.data || [])
    } catch (err) {
      console.error('Error fetching vehicles', err)
    }
  }

  useEffect(() => {
    fetchBoms()
    fetchVehicles()
  }, [])

  // Reactive filtering at runtime
  useEffect(() => {
    const start = fromDate ? new Date(fromDate) : null
    if (start && !isNaN(start.getTime())) {
      start.setHours(0, 0, 0, 0)
    }
    const end = toDate ? new Date(toDate) : null
    if (end && !isNaN(end.getTime())) {
      end.setHours(23, 59, 59, 999)
    }

    const result = data.filter(r => {
      const d = new Date(r.date)
      const startValid = start && !isNaN(start.getTime())
      const endValid = end && !isNaN(end.getTime())
      const dateMatch = (!startValid || d >= start) && (!endValid || d <= end)
      const custMatch = customer ? r.customerName === customer : true
      const serialMatch = serialNo ? (r.serviceJobNo === serialNo || r.serialJobNo === serialNo) : true
      const assemblyMatch = assemblyPartNo ? r.assemblyPartNo === assemblyPartNo : true
      return dateMatch && custMatch && serialMatch && assemblyMatch
    })
    setFilteredData(result)
  }, [data, fromDate, toDate, customer, serialNo, assemblyPartNo])

  useEffect(() => {
    let partNo = null
    let inlineImg = null

    if (selectedChildRow) {
      const keys = Object.keys(selectedChildRow)
      const partNoKey = keys.find(k => {
        const l = k.toLowerCase()
        return l.includes('part number') || l.includes('part no') || l === 'part' || l === 'partno'
      })
      if (partNoKey) {
        partNo = selectedChildRow[partNoKey]
      }

      inlineImg = Object.values(selectedChildRow).find(val =>
        typeof val === 'string' && (val.startsWith('data:image/') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/uploads/') || val.startsWith('/api/'))
      ) || null
    } else {
      const selectedRow = data.find(r => r.id === selectedId)
      partNo = selectedRow?.assemblyPartNo
    }

    if (!partNo) {
      setSelectedPartImage(inlineImg || null)
      return
    }

    const controller = new AbortController()
    api.get(`/api/item-master?limit=1&search=${encodeURIComponent(partNo)}`, { signal: controller.signal })
      .then(res => {
        const item = res.data?.data?.[0]
        if (item) {
          const hasImg = item.hasImage || !!item.imageMimeType
          if (hasImg) {
            setSelectedPartImage(`/api/item-master/${item.id}/download-image`)
          } else if (item.imagePath) {
            if (item.imagePath.startsWith('http') || item.imagePath.startsWith('/')) {
              setSelectedPartImage(item.imagePath)
            } else {
              setSelectedPartImage(`/uploads/${item.imagePath}`)
            }
          } else {
            setSelectedPartImage(inlineImg || null)
          }
        } else {
          setSelectedPartImage(inlineImg || null)
        }
      })
      .catch(err => {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Error loading part image', err)
        }
        setSelectedPartImage(inlineImg || null)
      })

    return () => controller.abort()
  }, [selectedId, selectedChildRow, data])

  const handleSearch = () => {
    setSearching(true)
    fetchBoms().finally(() => {
      setTimeout(() => {
        setSearching(false)
      }, 400)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const id = deleteTarget.id
      await api.delete(`/api/bom-creation/${id}`)
      const next = data.filter(r => r.id !== id)
      setData(next)
      setFilteredData(filteredData.filter(r => r.id !== id))
      setDeleteTarget(null)
      setSelectedId(null)
    } catch (err) {
      console.error('Error deleting record', err)
      toast.error('Error deleting record from database.')
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const handleClearFilters = () => {
    setFromDate('')
    setToDate('')
    setCustomer('')
    setSerialNo('')
    setAssemblyPartNo('')
    setSelectedId(null)
    setSelectedChildRow(null)
  }

  // --- Export Actions ---

  const handleExportExcel = async () => {
    if (filteredData.length === 0) {
      toast.warning('No data available to export.')
      return
    }
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('BOM Creations')

      worksheet.columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        { header: 'BOM No', key: 'bomNo', width: 15 },
        { header: 'Customer Name', key: 'customerName', width: 30 },
        { header: 'Customer Code', key: 'customerCode', width: 15 },
        { header: 'Service Job No', key: 'serviceJobNo', width: 25 },
        { header: 'Vehicle Count', key: 'vehicleSerialNo', width: 15 },
        { header: 'Assembly Part Name', key: 'assemblyPartNo', width: 25 },
        { header: 'Model Name', key: 'model', width: 20 },
        { header: 'Created Date', key: 'date', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
      ]

      filteredData.forEach((row, idx) => {
        const count = vehicles.filter(v => v.customer?.customerName === row.customerName).length;
        const finalCount = count > 0 ? count : (row.vehicleCount || 0);

        worksheet.addRow({
          sno: idx + 1,
          bomNo: row.bomNo,
          customerName: row.customerName,
          customerCode: row.customerCode || 'N/A',
          serviceJobNo: row.serialJobNo || row.serviceJobNo || 'N/A',
          vehicleSerialNo: finalCount,
          assemblyPartNo: row.assemblyPartNo || 'N/A',
          model: row.model || 'N/A',
          date: row.date ? row.date.split('T')[0] : 'N/A',
          status: row.status || 'Created',
        })
      })

      worksheet.getRow(1).font = { bold: true }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `bom_creation_report_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
    } catch (err) {
      console.error(err)
      toast.error('Error exporting to Excel')
    }
  }

  const handleExportDoc = () => {
    if (filteredData.length === 0) {
      toast.warning('No data available to export.')
      return
    }

    let htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>BOM Creation Report</title>
        <style>
          body { font-family: Arial, sans-serif; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #0097A7; color: white; padding: 8px; border: 1px solid #ddd; text-align: left; }
          td { padding: 8px; border: 1px solid #ddd; }
          h2 { color: #333; }
        </style>
      </head>
      <body>
        <h2>Customerwise BOM Creation Report</h2>
        <p>Report Date: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              <th>BOM No</th>
              <th>Customer Name</th>
              <th>Customer Code</th>
              <th>Service Job No</th>
              <th>Vehicle Count</th>
              <th>Assembly Part Name</th>
              <th>Model Name</th>
              <th>Created Date</th>
            </tr>
          </thead>
          <tbody>
    `

    filteredData.forEach((row, idx) => {
      const count = vehicles.filter(v => v.customer?.customerName === row.customerName).length;
      const finalCount = count > 0 ? count : (row.vehicleCount || 0);

      htmlContent += `
        <tr>
          <td>${idx + 1}</td>
          <td><b>${row.bomNo}</b></td>
          <td>${row.customerName}</td>
          <td>${row.customerCode || 'N/A'}</td>
          <td>${row.serialJobNo || row.serviceJobNo || 'N/A'}</td>
          <td>${finalCount}</td>
          <td>${row.assemblyPartNo || 'N/A'}</td>
          <td>${row.model || 'N/A'}</td>
          <td>${row.date ? row.date.split('T')[0] : 'N/A'}</td>
        </tr>
      `
    })

    htmlContent += `
          </tbody>
        </table>
      </body>
      </html>
    `

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `bom_creation_report_${new Date().toISOString().split('T')[0]}.doc`
    link.click()
  }

  const handleExportPdf = () => {
    if (filteredData.length === 0) {
      toast.warning('No data available to export.')
      return
    }

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    doc.setFillColor(0, 151, 167)
    doc.rect(0, 0, 297, 20, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(14)
    doc.text('VELSON ERP - CUSTOMERWISE BOM CREATION REPORT', 15, 13)

    doc.setTextColor(100, 116, 139)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Records: ${filteredData.length}`, 240, 28)
    doc.text(`Generated Date: ${new Date().toLocaleDateString()}`, 15, 28)

    let startY = 32
    doc.setFillColor(51, 65, 85)
    doc.rect(15, startY, 267, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.text('S.No', 17, startY + 5.5)
    doc.text('BOM No', 28, startY + 5.5)
    doc.text('Customer Name', 55, startY + 5.5)
    doc.text('Customer Code', 105, startY + 5.5)
    doc.text('Service Job No', 130, startY + 5.5)
    doc.text('Vehicle Count', 165, startY + 5.5)
    doc.text('Assembly Part Name', 195, startY + 5.5)
    doc.text('Model Name', 240, startY + 5.5)
    doc.text('Date', 265, startY + 5.5)

    let currentY = startY + 8
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)

    filteredData.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 267, 7, 'F')
      }

      doc.setTextColor(51, 65, 85)
      doc.text(String(idx + 1), 17, currentY + 4.5)

      doc.setTextColor(0, 151, 167)
      doc.setFont('Helvetica', 'bold')
      doc.text(row.bomNo, 28, currentY + 4.5)

      doc.setTextColor(15, 23, 42)
      doc.text(row.customerName.length > 25 ? row.customerName.substring(0, 25) + '...' : row.customerName, 55, currentY + 4.5)

      doc.setTextColor(51, 65, 85)
      doc.setFont('Helvetica', 'normal')
      doc.text(row.customerCode || 'N/A', 105, currentY + 4.5)
      doc.text(row.serialJobNo || row.serviceJobNo || 'N/A', 130, currentY + 4.5)
      const count = vehicles.filter(v => v.customer?.customerName === row.customerName).length;
      const finalCount = count > 0 ? count : (row.vehicleCount || 0);
      doc.text(String(finalCount), 165, currentY + 4.5)
      doc.text(row.assemblyPartNo || 'N/A', 195, currentY + 4.5)
      doc.text(row.model || 'N/A', 240, currentY + 4.5)
      doc.text(row.date ? row.date.split('T')[0] : 'N/A', 265, currentY + 4.5)

      doc.setDrawColor(241, 245, 249)
      doc.line(15, currentY + 7, 282, currentY + 7)

      currentY += 7

      if (currentY > 185) {
        doc.addPage()
        doc.setFillColor(51, 65, 85)
        doc.rect(15, 10, 267, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('Helvetica', 'bold')
        doc.text('S.No', 17, 15.5)
        doc.text('BOM No', 28, 15.5)
        doc.text('Customer Name', 55, 15.5)
        doc.text('Customer Code', 105, 15.5)
        doc.text('Service Job No', 130, 15.5)
        doc.text('Vehicle Count', 165, 15.5)
        doc.text('Assembly Part Name', 195, 15.5)
        doc.text('Model Name', 240, 15.5)
        doc.text('Date', 265, 15.5)
        currentY = 18
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(8)
      }
    })

    doc.save(`bom_creation_report_${new Date().toISOString().split('T')[0]}.pdf`)
  }

  const handlePrintReport = () => {
    if (filteredData.length === 0) {
      toast.warning('No records available to print.')
      return
    }
    const printWindow = window.open('', '_blank', 'width=950,height=750')
    printWindow.document.write(`
      <html>
        <head>
          <title>Customerwise BOM Creation Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 24px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 11px; text-transform: uppercase; font-weight: bold; padding: 10px 8px; border: 1px solid #0097A7; text-align: left; }
            td { padding: 10px 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .text-center { text-align: center; }
            .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>VELSON ERP</h1>
              <p>Customerwise BOM Creation Report</p>
            </div>
            <div style="text-align: right;">
              <h2 style="margin:0; font-size:16px; color:#475569;">BOM Registry</h2>
              <p>Total Records: ${filteredData.length}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                <th style="width: 10%">BOM No</th>
                <th style="width: 20%">Customer Name</th>
                <th style="width: 10%">Customer Code</th>
                <th style="width: 15%">Service Job No</th>
                <th style="width: 12%">Vehicle Count</th>
                <th style="width: 13%">Assembly Part</th>
                <th style="width: 10%">Model</th>
                <th style="width: 5%">Created Date</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData.map((row, idx) => {
      const count = vehicles.filter(v => v.customer?.customerName === row.customerName).length;
      const finalCount = count > 0 ? count : (row.vehicleCount || 0);
      return `
                <tr>
                  <td class="text-center">${idx + 1}</td>
                  <td style="font-weight: bold; color: #0097A7;">${row.bomNo}</td>
                  <td><b>${row.customerName}</b></td>
                  <td>${row.customerCode || 'N/A'}</td>
                  <td>${row.serialJobNo || row.serviceJobNo || 'N/A'}</td>
                  <td class="text-center">${finalCount}</td>
                  <td>${row.assemblyPartNo || 'N/A'}</td>
                  <td>${row.model || 'N/A'}</td>
                  <td>${row.date ? row.date.split('T')[0] : 'N/A'}</td>
                </tr>
                `;
    }).join('')}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated Report - Confidentially Printed
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleExportChildExcel = async (bomRecord) => {
    if (!bomRecord || !bomRecord.excelRows || bomRecord.excelRows.length === 0) return
    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet(`BOM_${bomRecord.bomNo}_Details`)

      const headers = Object.keys(bomRecord.excelRows[0] || {})
      const columns = [
        { header: 'S.No', key: 'sno', width: 8 },
        ...headers.map(h => ({ header: h, key: h, width: 20 }))
      ]
      worksheet.columns = columns

      bomRecord.excelRows.forEach((row, idx) => {
        const rowData = { sno: idx + 1 }
        headers.forEach(h => {
          rowData[h] = row[h] || ''
        })
        worksheet.addRow(rowData)
      })

      worksheet.getRow(1).font = { bold: true }

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `BOM_${bomRecord.bomNo}_Child_Entries_${new Date().toISOString().split('T')[0]}.xlsx`
      link.click()
    } catch (err) {
      console.error(err)
      toast.error('Error exporting child entries to Excel')
    }
  }

  const handlePrintChildBOM = (bomRecord) => {
    if (!bomRecord || !bomRecord.excelRows || bomRecord.excelRows.length === 0) return
    const printWindow = window.open('', '_blank', 'width=950,height=750')
    const headers = Object.keys(bomRecord.excelRows[0] || {})
    printWindow.document.write(`
      <html>
        <head>
          <title>BOM Child Entries - ${bomRecord.bomNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #333; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0097A7; padding-bottom: 15px; margin-bottom: 20px; }
            h1 { margin: 0; color: #0097A7; font-size: 20px; text-transform: uppercase; font-weight: 800; }
            p { margin: 3px 0; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background: #0097A7; color: white; font-size: 10px; text-transform: uppercase; font-weight: bold; padding: 8px 6px; border: 1px solid #0097A7; text-align: left; }
            td { padding: 8px 6px; border: 1px solid #e2e8f0; font-size: 11px; }
            .text-center { text-align: center; }
            .footer { text-align: center; margin-top: 40px; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>BOM Child Entries</h1>
              <p>BOM No: <b>${bomRecord.bomNo}</b></p>
              <p>Customer: ${bomRecord.customerName} (${bomRecord.customerCode || 'N/A'})</p>
            </div>
            <div style="text-align: right;">
              <p>Service Job No: ${bomRecord.serviceJobNo || bomRecord.serialJobNo || 'N/A'}</p>
              <p>Model: ${bomRecord.model || 'N/A'}</p>
              <p>Printed: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 5%">S.No</th>
                \${headers.map(h => \`<th>\${h}</th>\`).join('')}
              </tr>
            </thead>
            <tbody>
              \${bomRecord.excelRows.map((row, idx) => \`
                <tr>
                  <td class="text-center">\${idx + 1}</td>
                  \${headers.map(h => {
                    const val = row[h];
                    const valStr = String(val).trim();
                    const isImg = valStr.startsWith('http://') ||
                      valStr.startsWith('https://') ||
                      valStr.startsWith('/api/') ||
                      valStr.startsWith('/uploads/') ||
                      valStr.startsWith('data:image/');
                    if (isImg) {
                      return \`<td><img src="\${valStr}" style="max-height: 40px; max-width: 80px; object-fit: contain;" /></td>\`;
                    }
                    return \`<td>\${valStr}</td>\`;
                  }).join('')}
                </tr>
              \`).join('')}
            </tbody>
          </table>
          <div class="footer">
            VELSON ERP - System Generated BOM Report
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          <span>BOM</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">BOM Creation Report</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[700px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">Customerwise BOM Creation Report</h2>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={handlePrintReport} className="flex items-center gap-1.5 px-4 py-1.5 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold rounded shadow-sm">
                <Printer size={15} /> Print Report
              </button>
              <button
                onClick={() => {
                  if (!selectedId) {
                    toast.warning('Please select a record first.')
                    return
                  }
                  const row = data.find(r => r.id === selectedId)
                  if (row) {
                    setDeleteTarget(row)
                  }
                }}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-[11px] font-bold rounded shadow-sm transition-all"
              >
                <Trash2 size={15} /> Delete
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-4 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-black rounded transition-all shadow-sm">
                <X size={18} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 mb-8 grid grid-cols-12 gap-8">
              <div className="col-span-8 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2"><Label>Customer Name</Label></div>
                    <div className="col-span-10">
                      <Select
                        options={Array.from(new Set(data.map(r => r.customerName).filter(Boolean)))}
                        placeholder="--- All Customers ---"
                        value={customer}
                        onChange={e => setCustomer(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2"><Label>Service Job No</Label></div>
                    <div className="col-span-10">
                      <Select
                        options={Array.from(new Set(data.map(r => r.serviceJobNo || r.serialJobNo).filter(Boolean)))}
                        placeholder="--- All Service Job Numbers ---"
                        value={serialNo}
                        onChange={e => setSerialNo(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-2"><Label>Assembly Part No</Label></div>
                    <div className="col-span-10">
                      <Select
                        options={Array.from(new Set(data.map(r => r.assemblyPartNo).filter(Boolean)))}
                        placeholder="--- All Assembly Parts ---"
                        value={assemblyPartNo}
                        onChange={e => setAssemblyPartNo(e.target.value)}
                      />
                    </div>

                  </div>
                </div>
              </div>

              <div className="col-span-4 flex flex-col items-center justify-center border-l border-slate-100 pl-8">
                <div
                  onClick={() => selectedPartImage && setLightboxImage(selectedPartImage)}
                  className={`w-48 h-48 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 overflow-hidden relative shadow-sm transition-all duration-300 ${selectedPartImage ? 'cursor-zoom-in hover:shadow-md hover:scale-[1.02] hover:border-[#0097A7]/40' : ''
                    }`}
                >
                  {selectedPartImage ? (
                    <img
                      src={selectedPartImage}
                      alt="Part Preview"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <ImageIcon size={48} className="text-slate-300" />
                  )}
                </div>
                <p className="text-[10px] font-black text-slate-400 mt-2 uppercase tracking-widest">Part Preview</p>
                {selectedPartImage && (
                  <span
                    onClick={() => setLightboxImage(selectedPartImage)}
                    className="text-[9px] text-[#0097A7] font-semibold mt-1 cursor-pointer hover:underline"
                  >
                    Click to enlarge
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-6 py-2">
              <div className="flex items-center gap-3">
                <Label>From Date</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-40" />
              </div>
              <div className="flex items-center gap-3">
                <Label>To Date</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-40" />
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                {searching ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} />}
                Search
              </button>
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1 px-3 py-[7px] bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 text-[12px] font-bold rounded-lg shadow-sm transition-all active:scale-95 whitespace-nowrap w-full justify-center"
              >
                <RotateCcw size={14} className="text-slate-500" />
                Reset Filter
              </button>

              {/* <button
                onClick={handleSearch}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-[12px] font-bold rounded-lg transition-all shadow-sm active:scale-95 whitespace-nowrap"
              >
                {searching ? <RotateCcw size={14} className="animate-spin" /> : <Search size={14} className="text-[#0097A7]" />}
                Search Details
              </button> */}
              <div className="flex justify-items-end my-3 pl-[10%]">
                <div className="flex items-center gap-2">
                  {[
                    // { icon: <List size={14} />, l: 'LS' },
                    { icon: <Printer size={14} />, l: 'DOS' },
                    { icon: <FileText size={14} className="text-blue-500" />, l: 'DOC' },
                    { icon: <FileSpreadsheet size={14} className="text-green-600" />, l: 'xls' },
                    { icon: <Download size={14} className="text-red-500" />, l: 'PDF' },
                    // { icon: <Filter size={14} className="text-[#0097A7]" />, l: 'Clear Filter' },
                    // { icon: <Settings size={14} className="text-slate-500" />, l: 'Setting' },
                  ].map(tool => (
                    <button
                      key={tool.l}
                      onClick={() => {
                        if (tool.l === 'DOS') handlePrintReport();
                        else if (tool.l === 'DOC') handleExportDoc();
                        else if (tool.l === 'xls') handleExportExcel();
                        else if (tool.l === 'PDF') handleExportPdf();
                        else if (tool.l === 'Clear Filter') handleClearFilters();
                        else toast.info(`${tool.l} clicked!`);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-bold rounded-lg shadow-sm transition-all active:scale-95"
                    >
                      {tool.icon} {tool.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>


            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-4 border-r border-slate-100 w-16 text-center">S.No</th>
                    <th className="px-5 py-4 border-r border-slate-100">BOM No</th>
                    <th className="px-5 py-4 border-r border-slate-100">Customer Name</th>
                    <th className="px-5 py-4 border-r border-slate-100">Customer Code</th>
                    <th className="px-5 py-4 border-r border-slate-100">Service Job no</th>
                    <th className="px-5 py-4 border-r border-slate-100">Vehicle Count</th>
                    <th className="px-5 py-4 border-r border-slate-100">Assembly Part name</th>
                    <th className="px-5 py-4 border-r border-slate-100">Model Name</th>
                    <th className="px-5 py-4 border-r border-slate-100">Created Date</th>
                    <th className="px-5 py-4 text-center">Created By</th>
                    <th className="px-5 py-4 text-center w-24">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[12px]">
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-24 text-center text-slate-200 italic">
                        No BOM creation records match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <Fragment key={row.id}>
                        <tr
                          onClick={() => {
                            setSelectedId(row.id === selectedId ? null : row.id)
                            setExpandedBomId(row.id === expandedBomId ? null : row.id)
                            setSelectedChildRow(null)
                          }}
                          className={`cursor-pointer transition-colors h-14 group ${row.id === selectedId ? 'bg-[#0097A7]/10 hover:bg-[#0097A7]/15 font-semibold' : 'hover:bg-[#0097A7]/5'}`}
                        >
                          <td className="px-5 py-2 border-r border-slate-50 text-center text-slate-300 font-bold">{idx + 1}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-black text-[#0097A7]">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedBomId(row.id === expandedBomId ? null : row.id)
                                }}
                                className="p-1 rounded bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-all flex items-center justify-center animate-none"
                                title={row.id === expandedBomId ? "Collapse Child Entries" : "View Child Entries"}
                              >
                                {row.id === expandedBomId ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                              <span>{row.bomNo}</span>
                            </div>
                          </td>
                          <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-700">{row.customerName}</td>
                          <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-medium">{row.customerCode || 'N/A'}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-600 uppercase text-[11px] truncate max-w-[300px]">{row.serialJobNo || row.serviceJobNo || 'N/A'}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-semibold text-slate-600 uppercase text-[11px] text-center">
                            {(() => {
                              const count = vehicles.filter(v => v.customer?.customerName === row.customerName).length;
                              return count > 0 ? count : (row.vehicleCount || 0);
                            })()}
                          </td>
                          <td className="px-5 py-2 border-r border-slate-50">{row.assemblyPartNo || 'N/A'}</td>
                          <td className="px-5 py-2 border-r border-slate-50">{row.model || 'N/A'}</td>
                          <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-400">{row.date ? row.date.split('T')[0] : 'N/A'}</td>
                          <td className="px-5 py-2 text-center font-black text-slate-700 text-[11px]">{row.createdBy || 'superadmin'}</td>
                          <td className="px-5 py-2 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteTarget(row)
                              }}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition-colors shadow-sm border border-rose-100"
                              title="Delete Record"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                        {row.id === expandedBomId && (
                          <tr className="bg-slate-50/70 hover:bg-slate-50/70">
                            <td colSpan={11} className="px-8 py-4 border-b border-slate-200">
                              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                  <h4 className="text-[11px] font-black text-[#0097A7] uppercase tracking-widest">
                                    Child Entries for BOM: {row.bomNo}
                                  </h4>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleExportChildExcel(row)
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded shadow-sm transition-all"
                                      title="Export Excel"
                                    >
                                      <FileSpreadsheet size={12} className="text-green-600" /> Export Excel
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handlePrintChildBOM(row)
                                      }}
                                      className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-bold rounded shadow-sm transition-all"
                                      title="Print BOM"
                                    >
                                      <Printer size={12} className="text-slate-600" /> Print
                                    </button>
                                  </div>
                                </div>
                                {!row.excelRows || row.excelRows.length === 0 ? (
                                  <div className="text-center text-slate-400 py-6 italic text-[11px]">
                                    No child entries saved for this BOM.
                                  </div>
                                ) : (
                                  <table className="w-full text-left border-collapse text-[11px]">
                                    <thead className="bg-slate-50/80 text-[10px] uppercase text-slate-400 font-bold border-b border-slate-200">
                                      <tr>
                                        <th className="px-4 py-2 border-r border-slate-100 w-12 text-center">S.No</th>
                                        {Object.keys(row.excelRows[0] || {}).map((header, hIdx) => (
                                          <th key={hIdx} className="px-4 py-2 border-r border-slate-100">{header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 bg-white">
                                      {row.excelRows.map((childRow, childIdx) => (
                                        <tr
                                          key={childIdx}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setSelectedChildRow(childRow === selectedChildRow ? null : childRow)
                                            setSelectedId(row.id)
                                          }}
                                          className={`cursor-pointer transition-colors ${childRow === selectedChildRow
                                            ? 'bg-[#0097A7]/10 hover:bg-[#0097A7]/15 font-semibold'
                                            : 'hover:bg-[#0097A7]/5'
                                            }`}
                                        >
                                          <td className="px-4 py-1.5 border-r border-slate-50 text-center text-slate-400 font-bold">{childIdx + 1}</td>
                                          {Object.entries(childRow).map(([key, val], colIdx) => {
                                            const valStr = String(val).trim();
                                            const isImg = valStr.startsWith('http://') ||
                                              valStr.startsWith('https://') ||
                                              valStr.startsWith('/api/') ||
                                              valStr.startsWith('/uploads/') ||
                                              valStr.startsWith('data:image/');
                                            return (
                                              <td key={colIdx} className="px-4 py-1.5 border-r border-slate-50 text-slate-600">
                                                {isImg ? (
                                                  <img
                                                    src={valStr}
                                                    alt="Preview"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      setLightboxImage(valStr);
                                                    }}
                                                    className="max-h-12 max-w-[80px] object-contain rounded border border-slate-200 cursor-zoom-in hover:scale-105 hover:shadow-sm transition-all duration-200"
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
                                )}
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

            {/* <div className="mt-8 bg-slate-900 rounded-2xl p-6 shadow-2xl flex items-center justify-between border border-slate-800">
              <div className="flex items-center gap-12">
                <div>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Total Recordset</p>
                  <p className="text-[24px] font-black text-white leading-none">{filteredData.length}</p>
                </div>
                <div className="w-[1px] h-10 bg-white/10" />
                <div>
                  <p className="text-white/30 text-[9px] font-black uppercase tracking-widest mb-1">Active Customers</p>
                  <p className="text-[24px] font-black text-[#0097A7] leading-none">
                    {new Set(filteredData.map(r => r.customerName)).size}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <button className="bg-white/5 hover:bg-white/10 text-white/50 px-6 py-2 rounded-lg border border-white/10 text-[11px] font-bold transition-all uppercase tracking-widest">
                  Request Data Audit
                </button>
              </div>
            </div> */}
          </div>
        </div>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete BOM Record"
        message={`Are you sure you want to delete BOM "${deleteTarget?.bomNo}"? This cannot be undone.`}
        confirming={deleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Image Lightbox Modal */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-opacity duration-300"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-2xl p-4 shadow-2xl max-w-3xl max-h-[85vh] relative flex flex-col items-center transition-all duration-300 scale-100"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-800 flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
            >
              <X size={18} />
            </button>
            <div className="overflow-hidden rounded-xl border border-slate-100 flex items-center justify-center bg-slate-50 max-w-full max-h-[70vh]">
              <img
                src={lightboxImage}
                alt="Enlarged Part Preview"
                className="max-w-full max-h-[65vh] object-contain p-2"
              />
            </div>
            <p className="text-[11px] font-bold text-slate-400 mt-3 uppercase tracking-wider">
              Part Image View
            </p>
          </div>
        </div>
      )}


    </div>
  )
}