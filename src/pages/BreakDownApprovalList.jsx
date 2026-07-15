import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Search, Download, FileSpreadsheet, FileJson, Filter, Settings, Wrench, Calendar, RotateCcw, CheckCircle2
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import { useToast } from '../components/Toast'
import api from '../services/api'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-semibold text-slate-600 mb-1 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, className = "" }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    className={`px-3 py-[7px] text-sm border border-slate-200 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 ${className}`}
  />
)

export default function BreakDownApprovalList() {
  const toast = useToast()
  const [fromDate, setFromDate] = useState(new Date().toISOString().split('T')[0])
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0])
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [searching, setSearching] = useState(false)

  const fetchAllBreakdowns = () => {
    setSearching(true)
    api.get('/api/machine-breakdown')
      .then(res => {
        if (res.data?.success) {
          setData(res.data.data || [])
          setFilteredData(res.data.data || [])
        }
        setSearching(false)
      })
      .catch(err => {
        console.error('Failed to fetch breakdowns for ledger:', err)
        setSearching(false)
      })
  }

  useEffect(() => {
    fetchAllBreakdowns()
  }, [])

  const parseTicketDate = (dateStr) => {
    if (!dateStr) return null
    if (dateStr instanceof Date) return dateStr
    const d = new Date(dateStr)
    if (!isNaN(d.getTime())) return d
    
    try {
      const parts = dateStr.trim().split(/\s+/)
      if (parts.length < 2) return null
      
      const datePart = parts[0]
      const timePart = parts[1]
      const ampm = parts[2]
      
      const [day, monthStr, year] = datePart.split('-')
      const [hoursStr, minutesStr] = timePart.split(':')
      
      let hours = parseInt(hoursStr, 10)
      const minutes = parseInt(minutesStr, 10)
      
      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      }
      const month = months[monthStr.toLowerCase().substring(0, 3)]
      
      if (ampm && ampm.toUpperCase() === 'PM' && hours < 12) {
        hours += 12
      } else if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0
      }
      
      return new Date(parseInt(year, 10), month, parseInt(day, 10), hours, minutes, 0, 0)
    } catch (e) {
      console.error('Failed to parse date string:', dateStr, e)
      return null
    }
  }

  const handleSearch = () => {
    if (!fromDate || !toDate) {
      toast.warning('Please select both Filter From and Filter To dates.')
      return
    }

    const [fYear, fMonth, fDay] = fromDate.split('-').map(Number)
    const [tYear, tMonth, tDay] = toDate.split('-').map(Number)
    
    const start = new Date(fYear, fMonth - 1, fDay, 0, 0, 0, 0)
    const end = new Date(tYear, tMonth - 1, tDay, 23, 59, 59, 999)
    
    if (start > end) {
      toast.error('From Date cannot be greater than To Date.')
      return
    }

    setSearching(true)
    setFilteredData([]) // Clear previous results before loading new search results
    
    setTimeout(() => {
      try {
        const result = data.filter(r => {
          const ticketDate = parseTicketDate(r.date)
          if (!ticketDate) return false
          return ticketDate >= start && ticketDate <= end
        })
        setFilteredData(result)
        setSearching(false)
        if (result.length === 0) {
          toast.info('No approval records found for the selected date range.')
        } else {
          toast.success(`Found ${result.length} approval record(s).`)
        }
      } catch (err) {
        console.error('Failed to filter approval records:', err)
        toast.error('An error occurred while processing approval records.')
        setSearching(false)
      }
    }, 600)
  }

  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const exportData = filteredData.map((row, i) => ({
      'S.No': i + 1,
      'MachineName': row.machineName || '',
      'Item Name': row.partNo || '',
      'Process Stage': row.processStage || '',
      'Description': row.location || '',
      'Date': row.date || '',
      'Reason': row.problemDescription || '',
      'Action Taken': row.actionTaken || '',
      'Remark': row.remark || '',
      'ReportedBy': row.reportedBy || '',
      'SolvedBy': row.solvedBy || ''
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Approvals')
    XLSX.writeFile(wb, `breakdown_approvals_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel spreadsheet downloaded successfully.')
  }

  const handleExportPdf = () => {
    if (filteredData.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    // Teal Header Block
    doc.setFillColor(0, 151, 167)
    doc.rect(0, 0, 297, 24, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(15)
    doc.text('VELSON ERP - POST-MAINTENANCE APPROVAL LEDGER', 15, 15)

    doc.setTextColor(100, 116, 139)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Records: ${filteredData.length}`, 240, 31)
    doc.text(`Generated Date: ${new Date().toLocaleDateString('en-IN')}`, 20, 31)

    // Table Headers
    let startY = 36
    doc.setFillColor(44, 62, 80)
    doc.rect(15, startY, 267, 8, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(7)
    doc.text('S.No', 16, startY + 5.5)
    doc.text('Machine Name', 25, startY + 5.5)
    doc.text('Item Name', 55, startY + 5.5)
    doc.text('Stage', 85, startY + 5.5)
    doc.text('Description', 105, startY + 5.5)
    doc.text('Date', 125, startY + 5.5)
    doc.text('Reason', 145, startY + 5.5)
    doc.text('Action Taken', 185, startY + 5.5)
    doc.text('Remark', 220, startY + 5.5)
    doc.text('Reported', 245, startY + 5.5)
    doc.text('Solved By', 265, startY + 5.5)

    let currentY = startY + 8
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(6.5)

    filteredData.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 267, 7, 'F')
      }

      doc.setTextColor(51, 65, 85)
      doc.text(String(idx + 1), 16, currentY + 4.5)
      doc.text(row.machineName || '', 25, currentY + 4.5)
      doc.text(row.partNo || '', 55, currentY + 4.5)
      doc.text(row.processStage || '', 85, currentY + 4.5)
      doc.text(row.location || '', 105, currentY + 4.5)
      doc.text(row.date || '', 125, currentY + 4.5)

      const trReason = (row.problemDescription || '').substring(0, 20)
      doc.text(trReason, 145, currentY + 4.5)

      const trAction = (row.actionTaken || '').substring(0, 18)
      doc.text(trAction, 185, currentY + 4.5)

      const trRemark = (row.remark || '').substring(0, 15)
      doc.text(trRemark, 220, currentY + 4.5)

      doc.text(row.reportedBy || '', 245, currentY + 4.5)
      doc.text(row.solvedBy || '', 265, currentY + 4.5)

      doc.setDrawColor(241, 245, 249)
      doc.line(15, currentY + 7, 282, currentY + 7)

      currentY += 7

      if (currentY > 185) {
        doc.addPage()
        doc.setFillColor(44, 62, 80)
        doc.rect(15, 10, 267, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('Helvetica', 'bold')
        doc.text('S.No', 16, 15.5)
        doc.text('Machine Name', 25, 15.5)
        doc.text('Part No', 55, 15.5)
        doc.text('Stage', 85, 15.5)
        doc.text('Description', 105, 15.5)
        doc.text('Date', 125, 15.5)
        doc.text('Reason', 145, 15.5)
        doc.text('Action Taken', 185, 15.5)
        doc.text('Remark', 220, 15.5)
        doc.text('Reported', 245, 15.5)
        doc.text('Solved By', 265, 15.5)
        currentY = 18
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(6.5)
      }
    })

    doc.save(`breakdown_approvals_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF downloaded successfully.')
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-10">
      <div className="px-6 py-6">
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-black tracking-tight">
          {/* <span>Dashboard</span> <ChevronRight size={12} />  */}
          <span>Maintenance</span> <ChevronRight size={12} /> <span className="text-[#0097A7]">Maintenance Approval Hub</span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 bg-green-600 rounded" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-widest">Post-Maintenance Approval Ledger</h2>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black rounded-lg transition-all shadow-sm"
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              <button 
                onClick={handleExportPdf}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-black rounded-lg transition-all shadow-sm"
              >
                <Download size={14} /> PDF
              </button>
              <button onClick={() => window.history.back()} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white text-[11px] font-black rounded-lg transition-all shadow-sm">
                <X size={14} strokeWidth={2.5} /> Close
              </button>
            </div>
          </div>

          <div className="p-8 flex-1 flex flex-col space-y-8">
            {/* Filter Hub */}
            <div className="flex items-center gap-8 bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 shadow-inner">
              <div className="flex items-center gap-4">
                <Label>Filter From</Label>
                <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
              </div>
              <div className="flex items-center gap-4">
                <Label>Filter To</Label>
                <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
              </div>
              <button
                onClick={handleSearch}
                className="flex items-center gap-3 px-5 py-2 bg-[#0097A7] hover:bg-green-700 text-white text-[13px] font-black rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-widest"
              >
                {searching ? <RotateCcw size={18} className="animate-spin" /> : <Search size={18} />}
                Search Approvals
              </button>
            </div>

            <div className="flex-1 border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <table className="w-full table-fixed text-left border-collapse">
                <thead className="bg-[#fcfdfe] text-[9.5px] uppercase text-slate-400 font-black border-b border-slate-200">
                  <tr className="divide-x divide-slate-200">
                    <th className="px-1 py-3 w-[3%] text-center whitespace-normal break-words">S.No</th>
                    <th className="px-1.5 py-3 w-[11%] whitespace-normal break-words">MachineName</th>
                    <th className="px-1.5 py-3 w-[9%] whitespace-normal break-words">Item Name</th>
                    <th className="px-1.5 py-3 w-[10%] whitespace-normal break-words">Process Stage</th>
                    <th className="px-1.5 py-3 w-[9%] whitespace-normal break-words">Description</th>
                    <th className="px-1.5 py-3 w-[11%] text-center whitespace-normal break-words">Date</th>
                    <th className="px-1.5 py-3 w-[12%] whitespace-normal break-words">Reason</th>
                    <th className="px-1.5 py-3 w-[11%] whitespace-normal break-words">Action Taken</th>
                    <th className="px-1.5 py-3 w-[10%] whitespace-normal break-words">Remark</th>
                    <th className="px-1.5 py-3 w-[7%] whitespace-normal break-words">ReportedBy</th>
                    <th className="px-1.5 py-3 w-[7%] whitespace-normal break-words">SolvedBy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {searching ? (
                    <tr>
                      <td colSpan={11} className="py-24 text-center">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <RotateCcw size={28} className="animate-spin text-[#0097A7]" />
                          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#0097A7]">Searching Records...</span>
                        </div>
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-24 text-center text-slate-400 italic font-medium uppercase tracking-[0.15em]">
                        No approval records found for the selected date range.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-green-50/20 transition-colors h-14 group divide-x divide-slate-200 border-b border-slate-200">
                        <td className="px-1 py-2 text-center text-slate-300 font-bold whitespace-normal break-words">{idx + 1}</td>
                        <td className="px-1.5 py-2 font-bold text-[#0097A7] uppercase whitespace-normal break-words">{row.machineName}</td>
                        <td className="px-1.5 py-2 font-semibold text-slate-700 whitespace-normal break-words">{row.partNo || '-'}</td>
                        <td className="px-1.5 py-2 text-slate-500 whitespace-normal break-words">{row.processStage || 'Direct'}</td>
                        <td className="px-1.5 py-2 text-slate-500 whitespace-normal break-words">{row.location || '-'}</td>
                        <td className="px-1.5 py-2 text-center text-slate-400 font-medium whitespace-normal break-words">{row.date}</td>
                        <td className="px-1.5 py-2 text-slate-600 italic whitespace-normal break-words">{row.problemDescription}</td>
                        <td className="px-1.5 py-2 text-slate-600 whitespace-normal break-words">{row.actionTaken || '-'}</td>
                        <td className="px-1.5 py-2 text-slate-600 whitespace-normal break-words">{row.remark || '-'}</td>
                        <td className="px-1.5 py-2 font-bold text-slate-400 uppercase text-[9px] whitespace-normal break-words">{row.reportedBy}</td>
                        <td className="px-1.5 py-2 text-slate-600 whitespace-normal break-words">{row.solvedBy || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Premium Aggregate Footer */}
            {/* <div className="mt-8 bg-slate-900 rounded-[2.5rem] p-10 flex items-center justify-between shadow-2xl relative overflow-hidden border border-slate-800">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center gap-20 relative z-10">
                <div>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Total Approvals</p>
                  <p className="text-[32px] font-black text-white leading-none">{filteredData.length}</p>
                </div>
                <div className="w-[1px] h-12 bg-white/10" />
                <div>
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Pending Clearances</p>
                  <p className="text-[32px] font-black text-green-500 leading-none">{filteredData.filter(d => d.status !== 'Accepted').length}</p>
                </div>
              </div>
              <div className="text-right relative z-10 opacity-20">
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-white" />
                  <span className="text-white text-[11px] font-black uppercase tracking-[0.3em]">Compliance History Stream</span>
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  )
}