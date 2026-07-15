import { useState, useEffect } from 'react'
import {
  ChevronRight, X, Download, FileSpreadsheet, FileText, Filter, Settings, Search, CheckCircle2, RotateCcw, Printer
} from 'lucide-react'
import { useToast } from '../components/Toast'
import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import api from '../services/api'

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-0 uppercase tracking-wider whitespace-nowrap">
    {children}
  </label>
)

export default function BreakDownAcceptance() {
  const toast = useToast()
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedRowDetails, setSelectedRowDetails] = useState(null)

  const [filterOpen, setFilterOpen] = useState(false)
  const [filterText, setFilterText] = useState('')

  const displayRows = filterText.trim()
    ? filteredData.filter(r => {
      const q = filterText.toLowerCase()
      return (
        (r.machineName || '').toLowerCase().includes(q) ||
        (r.partNo || '').toLowerCase().includes(q) ||
        (r.processStage || '').toLowerCase().includes(q) ||
        (r.problemDescription || '').toLowerCase().includes(q) ||
        (r.reportedBy || '').toLowerCase().includes(q) ||
        (r.solvedBy || '').toLowerCase().includes(q)
      )
    })
    : filteredData

  const handleExportDOS = () => {
    if (displayRows.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const cols = [
      { label: 'S.No', width: 6, getVal: (r, i) => String(i + 1) },
      { label: 'Machine Name', width: 20, getVal: r => r.machineName || '' },
      { label: 'Part No', width: 18, getVal: r => r.partNo || '' },
      { label: 'Process Stage', width: 16, getVal: r => r.processStage || '' },
      { label: 'Date', width: 12, getVal: r => r.date || '' },
      { label: 'Problem', width: 25, getVal: r => r.problemDescription || '' },
      { label: 'Action Taken', width: 20, getVal: r => r.actionTaken || '' },
      { label: 'Remark', width: 15, getVal: r => r.remark || '' },
      { label: 'Reported By', width: 12, getVal: r => r.reportedBy || '' },
      { label: 'Cleared By', width: 12, getVal: r => r.solvedBy || '' }
    ]
    let lines = []
    lines.push('='.repeat(180))
    lines.push('VELSON ERP - MACHINE BREAKDOWN ACCEPTANCE LIST'.padStart(110))
    lines.push('='.repeat(180))
    lines.push(cols.map(c => c.label.padEnd(c.width)).join(' '))
    lines.push('-'.repeat(180))
    displayRows.forEach((r, idx) => {
      lines.push(cols.map(c => {
        const val = c.getVal(r, idx)
        return val.substring(0, c.width).padEnd(c.width)
      }).join(' '))
    })
    lines.push('='.repeat(180))
    lines.push(`Total Records: ${displayRows.length}   |   Exported: ${new Date().toLocaleString()}`)
    const blob = new Blob([lines.join('\r\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `breakdown_acceptance_${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success('DOS text file downloaded successfully.')
  }

  const handleExportExcel = () => {
    if (displayRows.length === 0) {
      toast.warning('No records to export.')
      return
    }
    const exportData = displayRows.map((r, i) => ({
      'S.No': i + 1,
      'Machine Name': r.machineName || '',
      'Part No': r.partNo || '',
      'Process Stage': r.processStage || '',
      'Date': r.date || '',
      'Problem': r.problemDescription || '',
      'Action Taken': r.actionTaken || '',
      'Remark': r.remark || '',
      'Reported By': r.reportedBy || '',
      'Cleared By': r.solvedBy || '',
      'Cleared Date': r.solvedDate ? r.solvedDate.replace('T', ' ') : 'N/A',
      'Status': r.status || 'waiting_acceptance'
    }))
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Acceptance Queue')
    XLSX.writeFile(wb, `breakdown_acceptance_${new Date().toISOString().split('T')[0]}.xlsx`)
    toast.success('Excel spreadsheet downloaded successfully.')
  }

  const handleExportPdf = () => {
    if (displayRows.length === 0) {
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
    doc.text('VELSON ERP - MACHINE BREAKDOWN ACCEPTANCE QUEUE', 15, 15)

    doc.setTextColor(100, 116, 139)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.text(`Total Records: ${displayRows.length}`, 240, 31)
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
    doc.text('Part No', 55, startY + 5.5)
    doc.text('Stage', 85, startY + 5.5)
    doc.text('Date', 105, startY + 5.5)
    doc.text('Problem', 122, startY + 5.5)
    doc.text('Action Taken', 162, startY + 5.5)
    doc.text('Remark', 202, startY + 5.5)
    doc.text('Reported', 232, startY + 5.5)
    doc.text('Cleared By', 255, startY + 5.5)

    let currentY = startY + 8
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(6.5)

    displayRows.forEach((row, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252)
        doc.rect(15, currentY, 267, 7, 'F')
      }

      doc.setTextColor(51, 65, 85)
      doc.text(String(idx + 1), 16, currentY + 4.5)
      doc.text(row.machineName || '', 25, currentY + 4.5)
      doc.text(row.partNo || '', 55, currentY + 4.5)
      doc.text(row.processStage || '', 85, currentY + 4.5)
      doc.text(row.date || '', 105, currentY + 4.5)

      const trProblem = (row.problemDescription || '').substring(0, 22)
      doc.text(trProblem, 122, currentY + 4.5)

      const trAction = (row.actionTaken || '').substring(0, 22)
      doc.text(trAction, 162, currentY + 4.5)

      const trRemark = (row.remark || '').substring(0, 18)
      doc.text(trRemark, 202, currentY + 4.5)

      doc.text(row.reportedBy || '', 232, currentY + 4.5)
      doc.text(row.solvedBy || '', 255, currentY + 4.5)

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
        doc.text('Date', 105, 15.5)
        doc.text('Problem', 122, 15.5)
        doc.text('Action Taken', 162, 15.5)
        doc.text('Remark', 202, 15.5)
        doc.text('Reported', 232, 15.5)
        doc.text('Cleared By', 255, 15.5)
        currentY = 18
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(6.5)
      }
    })

    doc.save(`breakdown_acceptance_${new Date().toISOString().split('T')[0]}.pdf`)
    toast.success('PDF downloaded successfully.')
  }

  const fetchStagedBreakdowns = () => {
    api.get('/api/machine-breakdown')
      .then(res => {
        if (res.data?.success) {
          const list = res.data.data || []
          setData(list)
          const acceptedQueue = list.filter(b => b.status === 'waiting_acceptance')
          setFilteredData(acceptedQueue)
        }
      })
      .catch(err => console.error('Failed to fetch breakdowns for acceptance:', err))
  }

  useEffect(() => {
    fetchStagedBreakdowns()
  }, [])

  const handleAcceptTicket = () => {
    api.put(`/api/machine-breakdown/${selectedRowDetails.id}`, { status: 'accepted' })
      .then(res => {
        if (res.data?.success) {
          toast.success('Breakdown ticket accepted successfully.')
          fetchStagedBreakdowns()
          setSelectedRowDetails(null)
        }
      })
      .catch(err => {
        console.error(err)
        toast.error(err.response?.data?.message || 'Failed to accept breakdown ticket.')
      })
  }

  return (
    <div className="bg-[#f1f5f9] min-h-screen">
      <div className="p-4">
        <div className="bg-white border border-slate-300 rounded shadow-sm overflow-hidden flex flex-col min-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-300 bg-[#f8fafc] px-3 py-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[12px] font-bold text-slate-800 uppercase tracking-tight">BreakDown Acceptance</h2>
            </div>

            <div className="flex items-center gap-1.5">
              <button onClick={() => window.history.back()} className="flex items-center gap-1 px-3 py-1 border border-slate-200 bg-white text-slate-600 text-[11px] font-bold rounded shadow-sm hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95">
                <X size={16} strokeWidth={3} /> Close
              </button>
            </div>
          </div>

          {/* Analytical Toolbar */}
          <div className="flex items-center justify-end gap-6 bg-white border-b border-slate-200 px-4 py-2 text-slate-500">
            <div className="flex items-center gap-1.5 border-r border-slate-200 pr-6">
              <span className="text-[11px] font-bold">LS</span>
              <input type="text" value={displayRows.length} readOnly className="w-8 px-1 py-0.5 border border-slate-300 rounded text-center text-[#0097A7] font-black text-[12px]" />
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleExportDOS} className="hover:text-slate-800 flex items-center gap-1 text-[11px] font-bold transition-colors">
                <Printer size={14} className="text-slate-400" /> Dos
              </button>
              <button onClick={handleExportExcel} className="hover:text-emerald-600 flex items-center gap-1 text-[11px] font-bold transition-colors">
                <FileSpreadsheet size={14} className="text-emerald-500" /> Excel
              </button>
              <button onClick={handleExportPdf} className="hover:text-rose-600 flex items-center gap-1 text-[11px] font-bold transition-colors">
                <FileText size={14} className="text-rose-500" /> Pdf
              </button>
              <button onClick={() => { setFilterOpen(!filterOpen); if (filterOpen) setFilterText(''); }} className={`hover:text-[#0097A7] flex items-center gap-1 text-[11px] font-bold transition-colors ${filterOpen ? 'text-[#0097A7]' : ''}`}>
                <Filter size={14} /> Filter
              </button>
            </div>
          </div>

          {/* Text filter panel */}
          {filterOpen && (
            <div className="px-4 py-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Search size={14} className="text-slate-400" />
              <input
                autoFocus
                type="text"
                value={filterText}
                onChange={e => setFilterText(e.target.value)}
                placeholder="Search by machine, part no, stage, problem, action taken, solved by..."
                className="flex-1 bg-white border border-slate-300 rounded px-2 py-1 text-[12px] focus:outline-none focus:border-[#0097A7]"
              />
              {filterText && (
                <button onClick={() => setFilterText('')} className="text-slate-400 hover:text-slate-600 font-bold text-[11px]">
                  Clear
                </button>
              )}
            </div>
          )}

          {/* High-Density Table */}
          <div className="flex-1 overflow-auto">
            <table className="w-full table-fixed text-left border-collapse">
              <thead className="bg-[#f8fafc] text-[9.5px] uppercase text-slate-500 font-bold border-b border-slate-300 sticky top-0 z-10">
                <tr className="divide-x divide-slate-300">
                  <th className="px-1 py-1.5 w-[3%] text-center whitespace-normal break-words">S.No</th>
                  <th className="px-1.5 py-1.5 w-[11%] whitespace-normal break-words">Machine Name</th>
                  <th className="px-1.5 py-1.5 w-[9%] whitespace-normal break-words">Item Name</th>
                  <th className="px-1.5 py-1.5 w-[10%] whitespace-normal break-words">Description</th>
                  <th className="px-1.5 py-1.5 w-[11%] text-center whitespace-normal break-words">Date</th>
                  <th className="px-1.5 py-1.5 w-[16%] whitespace-normal break-words">Problem</th>
                  <th className="px-1.5 py-1.5 w-[10%] whitespace-normal break-words">Action Taken</th>
                  <th className="px-1.5 py-1.5 w-[10%] whitespace-normal break-words">Remark</th>
                  <th className="px-1.5 py-1.5 w-[7%] whitespace-normal break-words">Reported By</th>
                  <th className="px-1.5 py-1.5 w-[7%] whitespace-normal break-words">Solved By</th>
                  <th className="px-1.5 py-1.5 w-[6%] text-center whitespace-normal break-words">Solved Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-[10.5px]">
                {displayRows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-24 text-center text-slate-300 italic uppercase font-black text-[10px] tracking-widest opacity-40">
                      No tickets staged in acceptance queue
                    </td>
                  </tr>
                ) : (
                  displayRows.map((row, idx) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedRowDetails(row)}
                      className="hover:bg-amber-50/40 transition-colors divide-x divide-slate-200 group cursor-pointer border-b border-slate-200"
                    >
                      <td className="px-1 py-1 text-center text-slate-300 font-bold whitespace-normal break-words">{idx + 1}</td>
                      <td className="px-1.5 py-1 font-bold text-[#0097A7] uppercase whitespace-normal break-words">{row.machineName}</td>
                      <td className="px-1.5 py-1 font-semibold text-slate-700 whitespace-normal break-words">{row.partNo}</td>
                      <td className="px-1.5 py-1 text-slate-500 whitespace-normal break-words">{row.processStage}</td>
                      <td className="px-1.5 py-1 text-center text-slate-400 font-medium whitespace-normal break-words">{row.date}</td>
                      <td className="px-1.5 py-1 text-slate-600 italic whitespace-normal break-words">{row.problemDescription}</td>
                      <td className="px-1.5 py-1 text-slate-600 whitespace-normal break-words">{row.actionTaken || '-'}</td>
                      <td className="px-1.5 py-1 text-slate-600 whitespace-normal break-words">{row.remark || '-'}</td>
                      <td className="px-1.5 py-1 font-bold text-slate-400 uppercase text-[9px] whitespace-normal break-words">{row.reportedBy}</td>
                      <td className="px-1.5 py-1 text-slate-600 whitespace-normal break-words">{row.solvedBy || '-'}</td>
                      <td className="px-1.5 py-1 text-center text-slate-500 whitespace-normal break-words">{row.solvedDate ? row.solvedDate.replace('T', ' ') : 'N/A'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Details Popup Modal with Acceptance Actions */}
      {selectedRowDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 bg-[#f8fafc] px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-[#0097A7] rounded-sm" />
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Accept Breakdown Ticket</h3>
              </div>
              <button
                onClick={() => setSelectedRowDetails(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 text-[12px] text-slate-800">
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Machine:</span>
                <span className="font-semibold">{selectedRowDetails.machineName}</span>
              </div>
              <div className="grid grid-cols-[100px_1fr] gap-1">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Part:</span>
                <span className="font-semibold">{selectedRowDetails.partNo}</span>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Problem Description</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 font-medium italic min-h-[40px]">
                  {selectedRowDetails.problemDescription || '-'}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Action Taken</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 min-h-[40px]">
                  {selectedRowDetails.actionTaken || '-'}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Remark</label>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 min-h-[40px]">
                  {selectedRowDetails.remark || '-'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Solved By</span>
                  <span className="font-semibold text-slate-700">{selectedRowDetails.solvedBy || '-'}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase">Solved Date</span>
                  <span className="font-semibold text-slate-700">
                    {selectedRowDetails.solvedDate ? selectedRowDetails.solvedDate.replace('T', ' ') : '-'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3 bg-slate-50">
              <button
                onClick={handleAcceptTicket}
                className="px-4 py-1.5 bg-[#0097A7] hover:bg-[#00838f] text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
              >
                Accept Ticket
              </button>
              <button
                onClick={() => setSelectedRowDetails(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}