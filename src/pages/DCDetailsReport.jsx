import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Search, FileBarChart, Play, Edit2, Trash2, Printer, 
  FileSpreadsheet, FileText, Filter, Settings, Download, Camera, FileDown
} from 'lucide-react'
import api from '../services/api'
import { useToast } from '../components/Toast'
import * as XLSX from 'xlsx'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Select = ({ options, value, onChange, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      value={value}
      onChange={onChange}
      className="w-full px-2 py-0.5 text-[12px] border border-slate-300 rounded bg-white text-slate-700 appearance-none focus:outline-none focus:ring-1 focus:ring-[#0097A7] transition-all cursor-pointer font-bold"
    >
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-1 flex items-center">
      <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  </div>
)

const HeaderButton = ({ children, onClick, className = "", color = "slate" }) => {
  const colors = {
    slate: "text-slate-600 hover:bg-slate-50",
    emerald: "text-emerald-600 hover:bg-emerald-50",
    rose: "text-rose-600 hover:bg-rose-50",
    teal: "text-[#0097A7] hover:bg-[#f0f9fa]"
  }
  return (
    <button onClick={onClick} className={`flex items-center gap-1 px-3 py-1 border border-slate-200 bg-white text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 ${colors[color]} ${className}`}>
      {children}
    </button>
  )
}

const FilterButton = ({ children, onClick, className = "", icon = null }) => (
  <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1 bg-[#f8fafc] border border-slate-300 hover:border-[#0097A7] text-slate-700 text-[11px] font-bold rounded shadow-sm transition-all active:scale-95 whitespace-nowrap ${className}`}>
    {icon === 'dot' && <div className="w-2.5 h-2.5 bg-red-600 rounded-full" />}
    {icon === 'printer' && <Printer size={14} className="text-slate-400" />}
    {children}
  </button>
)

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
};

const parseCustomDate = (str) => {
  if (!str) return null;
  const parts = str.split('-');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthIndex = months.indexOf(parts[1]);
  const year = parseInt(parts[2], 10);
  if (monthIndex === -1 || isNaN(day) || isNaN(year)) return null;
  return new Date(year, monthIndex, day);
};

export default function DCDetailsReport() {
  const [dcs, setDcs] = useState([])
  const [dates, setDates] = useState([])
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filteredDcs, setFilteredDcs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDcId, setSelectedDcId] = useState(null)
  const toast = useToast()

  const getSelectedRow = () => dcs.find(row => String(row.id || row.dcNo) === String(selectedDcId))

  const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }

  const handleEdit = () => {
    const selectedRow = getSelectedRow()
    if (!selectedRow) {
      toast.warning('Select a DC row first to edit.')
      return
    }
    toast.info(`Editing is not available in this view yet for DC #${selectedRow.dcNo}.`)
  }

  const handleDelete = () => {
    const selectedRow = getSelectedRow()
    if (!selectedRow) {
      toast.warning('Select a DC row first to delete.')
      return
    }
    toast.info(`Delete is not available in this view yet for DC #${selectedRow.dcNo}.`)
  }

  const handlePrintImage = () => {
    window.print()
  }

  const handleViewDetails = () => {
    const selectedRow = getSelectedRow()
    if (!selectedRow) {
      toast.warning('Select a DC row first to view details.')
      return
    }
    handlePrintRecord(selectedRow)
  }

  const handlePdfTemplate = (template) => {
    const selectedRow = getSelectedRow()
    if (!selectedRow) {
      toast.warning(`Select a DC row first to open PDF ${template}.`)
      return
    }
    toast.info(`Preparing PDF ${template} for DC #${selectedRow.dcNo}.`)
    handlePrintRecord(selectedRow)
  }

  const handleExportExcel = () => {
    if (filteredDcs.length === 0) {
      toast.warning('No records to export.')
      return
    }

    const exportData = filteredDcs.map((row, index) => ({
      'S.No': index + 1,
      'DC No': row.dcNo || '',
      'DC Date': formatDate(row.date),
      'DC Type': row.dcType || '',
      'Customer Name': row.partyName || '',
      'Contact Person': row.contPerson || '',
      'Contact No': row.contactNo || '',
      'Total Qty': row.totalQty || 0,
      'Total Amount': row.totalAmount || 0,
      'Vehicle No': row.vehicleNo || '',
      'Driver Name': row.driverName || '',
      'Despatch Through': row.desThrough || ''
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'DC Details')
    const workbookBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
    const workbookBlob = new Blob([workbookBuffer], { type: 'application/octet-stream' })
    const downloadUrl = URL.createObjectURL(workbookBlob)
    const filename = `dc_details_${new Date().toISOString().split('T')[0]}.xlsx`

    const previewWindow = window.open('', '_blank', 'width=1100,height=750')
    if (!previewWindow) {
      toast.error('Unable to open preview tab. Please allow popups for this site.')
      URL.revokeObjectURL(downloadUrl)
      return
    }

    const previewRowsHtml = exportData.map((row) => `
      <tr>
        ${Object.values(row).map(value => `<td>${String(value)}</td>`).join('')}
      </tr>
    `).join('')

    const previewHeadersHtml = Object.keys(exportData[0]).map(header => `<th class="px-3 py-2 border bg-slate-100 text-left text-xs text-slate-600">${header}</th>`).join('')

    previewWindow.document.write(`
      <html>
        <head>
          <title>DC Details Excel Preview</title>
          <style>
            body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1f2937; margin: 0; padding: 24px; background: #f8fafc; }
            .preview-shell { max-width: 1440px; margin: 0 auto; }
            .preview-header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 20px; }
            .preview-title { font-size: 1.1rem; font-weight: 800; color: #0f172a; }
            .preview-note { color: #475569; font-size: 0.92rem; }
            .download-button { display: inline-flex; align-items: center; justify-content: center; padding: 0.75rem 1.2rem; background: #059669; color: white; border-radius: 0.75rem; text-decoration: none; font-weight: 700; box-shadow: 0 6px 16px rgba(5, 150, 105, 0.12); }
            .download-button:hover { background: #047857; }
            .preview-table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08); }
            .preview-table th, .preview-table td { border: 1px solid #e2e8f0; padding: 10px 12px; font-size: 0.92rem; }
            .preview-table th { background: #f8fafc; color: #475569; text-transform: uppercase; letter-spacing: 0.02em; }
            .preview-table tr:nth-child(even) { background: #f8fafc; }
          </style>
        </head>
        <body>
          <div class="preview-shell">
            <div class="preview-header">
              <div>
                <div class="preview-title">Delivery Challan Excel Preview</div>
                <div class="preview-note">Preview the data first, then click Download Excel to save the file.</div>
              </div>
              <a class="download-button" href="${downloadUrl}" download="${filename}">Download Excel</a>
            </div>
            <table class="preview-table">
              <thead>
                <tr>${previewHeadersHtml}</tr>
              </thead>
              <tbody>
                ${previewRowsHtml}
              </tbody>
            </table>
          </div>
          <script>
            window.addEventListener('unload', function() {
              try { URL.revokeObjectURL('${downloadUrl}') } catch (e) { }
            })
          </script>
        </body>
      </html>
    `)
    previewWindow.document.close()
    toast.success('Excel preview opened in a new tab.')
  }

  const handleExportPdf = () => {
    if (filteredDcs.length === 0) {
      toast.warning('No records to print.')
      return
    }
    window.print()
  }

  const handleDos = () => {
    toast.info('DOS export is not available in this version.')
  }

  const handleFilter = () => {
    toast.info('Use the From Date and To Date dropdowns above to filter results.')
  }

  const handleSettings = () => {
    toast.info('No additional settings are available in this view.')
  }

  const handleRowSelect = (row) => {
    const key = String(row.id || row.dcNo || '')
    setSelectedDcId(prev => (prev === key ? null : key))
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/api/delivery-challan')
        if (res.data?.success) {
          const list = res.data.data || []
          setDcs(list)
          
          // Extract unique formatted dates
          const uniqueDatesMap = {}
          list.forEach(item => {
            const formatted = formatDate(item.date)
            if (formatted && formatted !== '—') {
              uniqueDatesMap[formatted] = new Date(item.date).getTime()
            }
          })
          
          const sortedFormattedDates = Object.keys(uniqueDatesMap).sort((a, b) => uniqueDatesMap[a] - uniqueDatesMap[b])
          setDates(sortedFormattedDates)
          
          if (sortedFormattedDates.length > 0) {
            setFromDate(sortedFormattedDates[0])
            setToDate(sortedFormattedDates[sortedFormattedDates.length - 1])
          }
        }
      } catch (err) {
        console.error("Error fetching DC details:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSearch = () => {
    const fromObj = parseCustomDate(fromDate)
    const toObj = parseCustomDate(toDate)
    
    const filtered = dcs.filter(dc => {
      const dcDateObj = new Date(dc.date)
      dcDateObj.setHours(0, 0, 0, 0)
      
      if (fromObj && dcDateObj < fromObj) return false
      if (toObj && dcDateObj > toObj) return false
      return true
    })
    setFilteredDcs(filtered)
  }

  useEffect(() => {
    if (dcs.length > 0) {
      handleSearch()
    } else {
      setFilteredDcs([])
    }
  }, [dcs, fromDate, toDate])

  const handlePrintRecord = (row) => {
    if (!row) return
    const printWindow = window.open('', '_blank', 'width=900,height=800')
    if (!printWindow) return

    const itemsHtml = (row.details || []).map((item, index) => `
      <tr>
        <td style="text-align: center;">${index + 1}</td>
        <td><b>${item.partNo || '—'}</b></td>
        <td>${item.partName || '—'}</td>
        <td>${item.spec || item.details || '—'}</td>
        <td style="text-align: right; font-weight: bold;">${item.qty || 0}</td>
        <td style="text-align: center;">${item.uom || item.unit || '—'}</td>
        <td style="text-align: right;">₹${Number(item.rate || 0).toFixed(2)}</td>
        <td style="text-align: right; font-weight: bold;">₹${Number(item.amount || 0).toFixed(2)}</td>
      </tr>
    `).join('')

    const totalQty = (row.details || []).reduce((sum, item) => sum + Number(item.qty || 0), 0)
    const totalAmount = (row.details || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)

    printWindow.document.write(`
      <html>
        <head>
          <title>Delivery Challan - ${row.dcNo}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .header-title { text-align: center; border-bottom: 3px solid #0f172a; padding-bottom: 12px; margin-bottom: 25px; }
            h1 { margin: 0; font-size: 24px; text-transform: uppercase; font-weight: 900; letter-spacing: 1.5px; color: #0f172a; }
            .grid-details { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; font-size: 13px; line-height: 1.6; }
            .grid-col p { margin: 4px 0; }
            .bold-label { font-weight: bold; display: inline-block; width: 140px; color: #475569; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { background: #f8fafc; color: #475569; font-size: 11px; text-transform: uppercase; font-weight: bold; padding: 10px 8px; border: 1px solid #cbd5e1; }
            td { padding: 10px 8px; border: 1px solid #e2e8f0; font-size: 12px; }
            .footer-sign { display: flex; justify-content: space-between; margin-top: 100px; font-size: 13px; font-weight: bold; }
            .footer-sign div { border-top: 2px solid #94a3b8; padding-top: 8px; width: 200px; text-align: center; }
            .sys-footer { text-align: center; margin-top: 60px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header-title">
            <h1>DELIVERY CHALLAN</h1>
          </div>
          <div class="grid-details">
            <div class="grid-col">
              <p><span class="bold-label">DC No:</span> <b>#${row.dcNo}</b></p>
              <p><span class="bold-label">DC Date:</span> ${formatDate(row.date)}</p>
              <p><span class="bold-label">Vehicle No:</span> ${row.vehicleNo || '—'}</p>
              <p><span class="bold-label">Driver Name:</span> ${row.driverName || '—'}</p>
            </div>
            <div class="grid-col">
              <p><span class="bold-label">Customer Name:</span> <b>${row.partyName}</b></p>
              <p><span class="bold-label">Address:</span> ${row.address || '—'}</p>
              <p><span class="bold-label">Despatch Through:</span> ${row.desThrough || '—'}</p>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 50px;">S.No</th>
                <th>Part No</th>
                <th>Part Name</th>
                <th>Description</th>
                <th style="width: 80px;">Qty</th>
                <th style="width: 70px;">Unit</th>
                <th style="width: 100px;">Rate</th>
                <th style="width: 120px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
              <tr style="background: #f8fafc; font-weight: bold;">
                <td colspan="4" style="text-align: right;">TOTAL</td>
                <td style="text-align: right;">${totalQty}</td>
                <td colspan="2"></td>
                <td style="text-align: right;">₹${totalAmount.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <div class="footer-sign">
            <div>Receiver's Signature</div>
            <div>Authorized Signatory</div>
          </div>
          <div class="sys-footer">
            VELSON ERP - System Generated Delivery Challan - Confidentially Printed
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
    <div className="bg-[#f1f5f9] min-h-screen">
      <div className="p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[90vh]">
          {/* Main Header */}
          <div className="flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">DC Details</h2>
            </div>
            
            <div className="flex items-center gap-1.5">
              <HeaderButton onClick={handleEdit} color="emerald"><Edit2 size={14} className="text-emerald-600" /> Edit</HeaderButton>
              <HeaderButton onClick={handleDelete} color="rose"><Trash2 size={14} className="text-rose-600" /> Delete</HeaderButton>
              <div className="w-[1px] h-4 bg-slate-300 mx-1" />
              <HeaderButton onClick={handlePrintImage}><Printer size={14} /> Print Image</HeaderButton>
              <HeaderButton onClick={() => window.history.back()} color="rose"><X size={16} strokeWidth={3} /> Close</HeaderButton>
            </div>
          </div>

          {/* Filters & Reports Bar */}
          <div className="flex items-center gap-4 bg-white border-b border-slate-200 px-4 py-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Label>From Date :</Label>
              <Select options={dates} value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-32" />
            </div>
            <div className="flex items-center gap-2">
              <Label>To Date :</Label>
              <Select options={dates} value={toDate} onChange={e => setToDate(e.target.value)} className="w-32" />
            </div>
            
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            
            <FilterButton onClick={handleSearch} icon="dot">Search</FilterButton>
            <FilterButton onClick={handleViewDetails} icon="dot">DC Details</FilterButton>
            
            <div className="w-[1px] h-6 bg-slate-200 mx-1" />
            
            <FilterButton onClick={() => handlePdfTemplate('M1')} icon="printer">PDF M1</FilterButton>
            <FilterButton onClick={() => handlePdfTemplate('M2')} icon="printer">PDF M2</FilterButton>
            <FilterButton onClick={() => handlePdfTemplate('M3')} icon="printer">PDF M3</FilterButton>

            <div className="ml-auto flex items-center gap-4 text-slate-500">
               <div className="flex items-center gap-1 text-[11px] font-bold">
                  <span>LS</span>
                  <input type="text" value="1" readOnly className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center text-[#0097A7] font-black" />
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={handleDos} className="hover:text-slate-800 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Printer size={14} className="text-slate-400" /> Dos</button>
                  <button onClick={handleExportExcel} className="hover:text-emerald-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileSpreadsheet size={14} className="text-emerald-500" /> Excel</button>
                  <button onClick={handleExportPdf} className="hover:text-rose-600 flex items-center gap-0.5 text-[11px] font-bold transition-colors"><FileText size={14} className="text-rose-500" /> Pdf</button>
                  <button onClick={handleFilter} className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Filter size={14} /> Filter</button>
                  <button onClick={handleSettings} className="hover:text-[#0097A7] flex items-center gap-0.5 text-[11px] font-bold transition-colors"><Settings size={14} /> Setting</button>
               </div>
            </div>
          </div>

          {/* Data Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm m-4">
            <table className="w-full text-left border-collapse min-w-[1500px]">
              <thead className="bg-[#fcfdfe] text-[9px] uppercase text-slate-400 font-black border-b border-slate-200">
                <tr className="divide-x divide-slate-100">
                  <th className="px-5 py-4 border-r border-slate-100 w-16 text-center">S.No</th>
                  <th className="px-5 py-4 border-r border-slate-100">DC No</th>
                  <th className="px-5 py-4 border-r border-slate-100">DC Date</th>
                  <th className="px-5 py-4 border-r border-slate-100">DC Type</th>
                  <th className="px-5 py-4 border-r border-slate-100">Customer Name</th>
                  <th className="px-5 py-4 border-r border-slate-100">Contact Person</th>
                  <th className="px-5 py-4 border-r border-slate-100">Contact No</th>
                  <th className="px-5 py-4 border-r border-slate-100 text-right">Total Qty</th>
                  <th className="px-5 py-4 border-r border-slate-100 text-right">Total Amount</th>
                  <th className="px-5 py-4 border-r border-slate-100">Vehicle No</th>
                  <th className="px-5 py-4 border-r border-slate-100">Driver Name</th>
                  <th className="px-5 py-4 border-r border-slate-100">Despatch Through</th>
                  <th className="px-5 py-4 text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-[12px]">
                {loading ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-slate-400 italic">
                      Loading Delivery Challans...
                    </td>
                  </tr>
                ) : filteredDcs.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="text-center py-8 text-slate-400 italic">
                      No Delivery Challan records found for the selected date range.
                    </td>
                  </tr>
                ) : (
                  filteredDcs.map((row, i) => {
                    const rowKey = String(row.id || row.dcNo || i)
                    const isSelected = selectedDcId === rowKey
                    return (
                      <tr
                        key={rowKey}
                        onClick={() => handleRowSelect(row)}
                        className={`h-14 transition-colors divide-x divide-slate-100 group cursor-pointer ${isSelected ? 'bg-[#0097A7]/10' : 'hover:bg-[#0097A7]/5'}`}
                      >
                        <td className="px-2 py-1 text-center text-slate-300 font-bold">{i + 1}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-black text-[#0097A7]">#{row.dcNo}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-400">{formatDate(row.date)}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-semibold text-slate-600">{row.dcType}</td>
                        <td className="px-5 py-2 border-r border-slate-50 font-bold text-slate-700">{row.partyName}</td>
                        <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-medium">{row.contPerson || '—'}</td>
                        <td className="px-5 py-2 border-r border-slate-50 text-slate-500 font-medium">{row.contactNo || '—'}</td>
                        <td className="px-5 py-2 border-r border-slate-50 text-right font-bold text-[#0097A7]">{row.totalQty || 0}</td>
                        <td className="px-5 py-2 border-r border-slate-50 text-right font-bold text-slate-800">₹{Number(row.totalAmount || 0).toFixed(2)}</td>
                        <td className="px-5 py-2 border-r border-slate-50">{row.vehicleNo || '—'}</td>
                        <td className="px-5 py-2 border-r border-slate-50">{row.driverName || '—'}</td>
                        <td className="px-5 py-2 border-r border-slate-50">{row.desThrough || '—'}</td>
                        <td className="px-5 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePrintRecord(row)
                            }}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#0097A7]/10 hover:bg-[#0097A7]/20 text-[#0097A7] transition-colors shadow-sm border border-[#0097A7]/20"
                            title="Print DC Record"
                          >
                            <Printer size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
