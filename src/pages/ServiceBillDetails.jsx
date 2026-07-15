import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  ChevronRight, X, Search, FileBarChart, Edit2, Trash2, Printer, 
  FileSpreadsheet, FileText, Filter, Settings, Download, XCircle, CheckCircle2, Info
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import logo from '../assets/logo.png'
import { getSocket } from '../services/socket'

// Helper to format date as DD/MM/YYYY
const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

// Helper to format numbers with commas and decimals
const formatNumber = (num, decimals = 2) => {
  const parsed = Number(num)
  if (isNaN(parsed)) return '0.00'
  return parsed.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// ── Shared UI primitives ──
const Label = ({ children }) => (
  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
    {children}
  </label>
)

const Input = ({ type = 'text', value, onChange, placeholder, className = "" }) => (
  <input
    type={type}
    value={value || ''}
    onChange={onChange}
    placeholder={placeholder}
    className={`px-4 py-2 text-[13px] border border-slate-200 rounded-lg bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/20 focus:border-[#0097A7] transition-all duration-200 hover:border-slate-300 shadow-sm ${className}`}
  />
)

export default function ServiceBillDetails() {
  const toast = useToast()
  const navigate = useNavigate()
  const { auth } = useAuth()
  const isAdmin = auth?.user?.role?.toUpperCase() === 'ADMIN' || auth?.user?.id === 0

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30) // Default to last 30 days
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])
  const [searchPartyName, setSearchPartyName] = useState('')
  const [bills, setBills] = useState([])
  const [selectedBillId, setSelectedBillId] = useState(null)
  const [showPreview, setShowPreview] = useState(false)
  const [previewBillData, setPreviewBillData] = useState(null)
  const [showCancelPopup, setShowCancelPopup] = useState(false)
  const [showApprovePopup, setShowApprovePopup] = useState(false)

  const fetchBills = async () => {
    try {
      const res = await api.get('/api/service-bill')
      if (res.data?.success) {
        setBills(res.data.data || [])
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load Service Bills')
    }
  }

  useEffect(() => {
    fetchBills()

    const socket = getSocket()
    const handleStatusUpdate = (payload) => {
      if (payload && payload.id) {
        setBills(prevBills => 
          prevBills.map(bill => 
            bill.id === payload.id ? { ...bill, status: payload.status } : bill
          )
        )
      }
    }

    socket.on('service-bill.status.updated', handleStatusUpdate)

    return () => {
      socket.off('service-bill.status.updated', handleStatusUpdate)
    }
  }, [])

  // Filter and sort bills based on dates and customer name, ordered by refNo descending
  const filteredBills = bills
    .filter(bill => {
      const billDateStr = bill.billDate ? new Date(bill.billDate).toISOString().split('T')[0] : ''
      const dateMatch = (!fromDate || billDateStr >= fromDate) && (!toDate || billDateStr <= toDate)
      const nameMatch = !searchPartyName || (bill.partyName || '').toLowerCase().includes(searchPartyName.toLowerCase())
      return dateMatch && nameMatch
    })
    .sort((a, b) => {
      const numA = parseInt(a.refNo, 10)
      const numB = parseInt(b.refNo, 10)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numB - numA
      }
      return (b.refNo || '').localeCompare(a.refNo || '')
    })

  const handleEdit = () => {
    if (!selectedBillId) {
      toast.error('Please select a bill row to edit')
      return
    }
    navigate('/sales/service-bill-entry', { state: { id: selectedBillId } })
  }

  const handleDelete = async () => {
    if (!selectedBillId) {
      toast.error('Please select a bill row to delete')
      return
    }
    if (window.confirm('Are you sure you want to delete the selected Service Bill?')) {
      try {
        const res = await api.delete(`/api/service-bill/${selectedBillId}`)
        if (res.data?.success) {
          toast.success('Service Bill deleted successfully')
          setSelectedBillId(null)
          fetchBills()
        }
      } catch (err) {
        console.error(err)
        toast.error('Failed to delete Service Bill')
      }
    }
  }

  const handlePrint = async () => {
    if (!selectedBillId) {
      toast.error('Please select a bill row to print')
      return
    }
    try {
      const res = await api.get(`/api/service-bill/${selectedBillId}`)
      if (res.data?.success && res.data.data) {
        setPreviewBillData(res.data.data)
        setShowPreview(true)
      } else {
        toast.error('Failed to fetch Service Bill details')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to load Service Bill for printing')
    }
  }

  const triggerBrowserPrint = () => {
    window.print()
  }

  const handleRequestCancel = async () => {
    if (!selectedBillId) {
      toast.error('Please select a bill row to cancel')
      return
    }
    try {
      const res = await api.put(`/api/service-bill/${selectedBillId}/request-cancel`)
      if (res.data?.success) {
        toast.success('Cancellation request submitted successfully!')
        setShowCancelPopup(false)
        fetchBills()
      } else {
        toast.error('Failed to submit cancellation request')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error submitting cancellation request')
    }
  }

  const handleApproveCancel = async () => {
    if (!selectedBillId) return
    try {
      const res = await api.put(`/api/service-bill/${selectedBillId}/approve-cancel`)
      if (res.data?.success) {
        toast.success('Service Bill cancelled successfully!')
        setShowApprovePopup(false)
        fetchBills()
      } else {
        toast.error('Failed to approve cancellation')
      }
    } catch (err) {
      console.error(err)
      toast.error('Error approving cancellation')
    }
  }

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'PendingCancel':
        return <span className="bg-amber-100 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pending Cancel</span>
      case 'Cancelled':
        return <span className="bg-rose-100 text-rose-800 border border-rose-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Cancelled</span>
      default:
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200/50 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Open</span>
    }
  }

  const selectedBill = bills.find(b => b.id === selectedBillId)
  const selectedBillStatus = selectedBill?.status || 'Open'
  const isSelectedBillOpen = selectedBillStatus === 'Open'
  const isSelectedBillPending = selectedBillStatus === 'PendingCancel'

  return (
    <div className="bg-[#f4f6f8] min-h-full">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5">
          <span className="hover:text-[#0097A7] cursor-pointer transition-colors uppercase tracking-widest">Sales</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0097A7] font-semibold uppercase tracking-widest">Service Bill Details</span>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[850px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 bg-red-700 rounded-sm" />
              <h2 className="text-[14px] font-black text-slate-800 uppercase tracking-tight">Service Bill Details</h2>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={handleEdit}
                disabled={!selectedBillId || !isSelectedBillOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-md transition-all shadow-sm group ${(!selectedBillId || !isSelectedBillOpen) ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
              >
                <Edit2 size={14} className="text-[#0097A7] group-hover:scale-110 transition-transform" /> Edit
              </button>
              <button 
                onClick={handleDelete}
                disabled={!selectedBillId || !isSelectedBillOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-[11px] font-bold rounded-md transition-all shadow-sm group ${(!selectedBillId || !isSelectedBillOpen) ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-rose-600'}`}
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> Delete
              </button>
              <button 
                onClick={handlePrint}
                disabled={!selectedBillId}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-md transition-all shadow-sm group ${!selectedBillId ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
              >
                <Printer size={14} className="text-[#0097A7] group-hover:scale-110 transition-transform" /> Print
              </button>
              <button 
                onClick={() => setShowCancelPopup(true)}
                disabled={!selectedBillId || !isSelectedBillOpen}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all shadow-sm group ${(!selectedBillId || !isSelectedBillOpen) ? 'bg-white border border-slate-200 opacity-50 cursor-not-allowed text-slate-400' : 'bg-amber-500 hover:bg-amber-600 text-white border-transparent'}`}
              >
                <XCircle size={14} className={`group-hover:scale-110 transition-transform ${(!selectedBillId || !isSelectedBillOpen) ? 'text-slate-400' : 'text-white'}`} /> Cancel Bill
              </button>
              {isAdmin && (
                <button 
                  onClick={() => setShowApprovePopup(true)}
                  disabled={!selectedBillId || !isSelectedBillPending}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-md transition-all shadow-sm group ${(!selectedBillId || !isSelectedBillPending) ? 'bg-white border border-slate-200 opacity-50 cursor-not-allowed text-slate-400' : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'}`}
                >
                  <CheckCircle2 size={14} className={`group-hover:scale-110 transition-transform ${(!selectedBillId || !isSelectedBillPending) ? 'text-slate-400' : 'text-white'}`} /> Approve Cancellation
                </button>
              )}
              <button 
                onClick={() => navigate('/sales/service-bill-entry')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[11px] font-bold rounded-md transition-all shadow-sm"
              >
                New Entry
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col">
            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-8 mb-6 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-4 w-full">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-3">
                    <Label>From Date :</Label>
                    <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="w-44" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>To Date :</Label>
                    <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="w-44" />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Customer Name :</Label>
                    <Input 
                      className="w-[250px]" 
                      placeholder="Search Customer..." 
                      value={searchPartyName}
                      onChange={e => setSearchPartyName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tool Icons Bar */}
            <div className="flex items-center justify-end gap-5 mb-4 px-2 text-slate-500">
              <div className="flex items-center gap-1.5 cursor-pointer hover:text-[#0097A7] transition-colors border-r border-slate-200 pr-5">
                <span className="text-[11px] font-bold">LS</span>
                <span className="text-[12px] font-black text-[#0097A7]">{filteredBills.length}</span>
              </div>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Dos">
                <Download size={16} />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Dos</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors group" title="Excel">
                <FileSpreadsheet size={16} />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-emerald-600">Excel</span>
              </button>
              <button 
                onClick={handlePrint}
                disabled={!selectedBillId}
                className={`flex items-center gap-1.5 hover:text-rose-600 transition-colors group ${!selectedBillId ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Pdf"
              >
                <FileText size={16} />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-rose-600">Pdf</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Filter">
                <Filter size={16} />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Filter</span>
              </button>
              <button className="flex items-center gap-1.5 hover:text-[#0097A7] transition-colors group" title="Setting">
                <Settings size={16} />
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-[#0097A7]">Setting</span>
              </button>
            </div>

            {/* Table */}
            <div className="flex-1 border border-slate-200 rounded-lg overflow-hidden overflow-x-auto shadow-sm">
              <table className="w-full text-left border-collapse min-w-[2000px] bg-white">
                <thead className="bg-[#cbd5e1]/30 text-[11px] uppercase text-slate-600 font-bold border-b border-slate-300">
                  <tr>
                    {[
                      { label: 'Bill No/Ref', w: 'w-32' },
                      { label: 'Service No', w: 'w-48' },
                      { label: 'Service Job', w: 'w-40' },
                      { label: 'Vehicle No', w: 'w-48' },
                      { label: 'Serial No', w: 'w-48' },
                      { label: 'Bill Date', w: 'w-36' },
                      { label: 'Tax Type', w: 'w-32' },
                      { label: 'Customer', w: 'w-64' },
                      { label: 'Material Cost', w: 'w-36' },
                      { label: 'Labour Charge', w: 'w-36' },
                      { label: 'GST %', w: 'w-24' },
                      { label: 'GST Amt', w: 'w-32' },
                      { label: 'Bill Amt', w: 'w-32' },
                      { label: 'Status', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 text-center whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={14} className="text-center py-10 text-slate-400 font-semibold uppercase italic">
                        No Service Bills Found
                      </td>
                    </tr>
                  ) : (
                    filteredBills.map((bill) => (
                      <tr 
                        key={bill.id} 
                        onClick={() => setSelectedBillId(bill.id === selectedBillId ? null : bill.id)}
                        className={`h-10 hover:bg-[#f0f9fa]/40 transition-colors cursor-pointer group ${bill.id === selectedBillId ? 'bg-[#0097A7]/10 font-bold' : ''}`}
                      >
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.refNo}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100 font-medium text-[#0097A7]">{bill.serviceNo}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.serviceJobNo}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.vehicleNo}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.serialNo}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{formatDate(bill.billDate)}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.taxType}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.partyName}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">₹{formatNumber(bill.materialCost)}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">₹{formatNumber(bill.labourCharge)}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{bill.gstPer}%</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">₹{formatNumber(bill.gstAmt)}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100 font-bold text-slate-800 tabular-nums">₹{formatNumber(bill.billAmt)}</td>
                        <td className="px-3 py-2 border-r text-center border-slate-100">{getStatusBadge(bill.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="mt-4 flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5 opacity-30 group hover:opacity-100 transition-opacity cursor-default">
                <FileBarChart size={14} className="text-[#0097A7]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 italic">Service Billing Analysis & Revenue Compliance Ledger</span>
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Records: <span className="text-[#0097A7]">{filteredBills.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cancellation Request Modal ── */}
      {showCancelPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Request to Cancel Bill
              </h3>
              <button 
                onClick={() => setShowCancelPopup(false)}
                className="text-slate-400 hover:text-slate-650 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-slate-600 leading-relaxed">
                You are requesting to cancel Service Bill <strong>{selectedBill?.refNo}</strong>. This request will be sent to the administrator for review and approval.
              </p>
              <div className="bg-blue-50 border border-blue-200/50 rounded-lg p-3 text-[11px] text-blue-700 leading-normal flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>Info: submitting this request alerts all administrators in real-time.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowCancelPopup(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold text-[11px] rounded-lg transition-all"
              >
                Close
              </button>
              <button
                onClick={handleRequestCancel}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] rounded-lg transition-all shadow-md"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Approve Cancellation Modal ── */}
      {showApprovePopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200 animate-[scaleIn_0.2s_ease-out]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Approve Cancellation Request
              </h3>
              <button 
                onClick={() => setShowApprovePopup(false)}
                className="text-slate-400 hover:text-slate-650 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-[12px] text-slate-600 leading-relaxed">
                Are you sure you want to approve the cancellation request for Service Bill <strong>{selectedBill?.refNo}</strong>? This action will mark the bill as <strong>Cancelled</strong>.
              </p>
              <div className="bg-emerald-50 border border-emerald-200/50 rounded-lg p-3 text-[11px] text-emerald-700 leading-normal flex items-start gap-2">
                <CheckCircle2 size={14} className="shrink-0 mt-0.5 text-emerald-600" />
                <span>Info: approving this request updates the bill status to Cancelled in real-time.</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                onClick={() => setShowApprovePopup(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold text-[11px] rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveCancel}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg transition-all shadow-md"
              >
                Approve & Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ── Bill Preview Modal overlay ── */}
      {showPreview && previewBillData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto no-print-backdrop">
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 0 !important;
              }
              body {
                background: white !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-invoice, #printable-invoice * {
                visibility: visible;
              }
              #printable-invoice {
                position: fixed !important;
                left: 0 !important;
                top: 0 !important;
                width: 210mm !important;
                height: 297mm !important;
                border: none !important;
                box-shadow: none !important;
                padding: 15mm !important;
                margin: 0 !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                page-break-before: avoid !important;
                box-sizing: border-box !important;
              }
              .print-spacer {
                height: 380px !important;
              }
              .no-print-backdrop, 
              .no-print-container, 
              .no-print-content-wrapper {
                position: static !important;
                display: block !important;
                background: transparent !important;
                backdrop-filter: none !important;
                padding: 0 !important;
                margin: 0 !important;
                overflow: visible !important;
                max-height: none !important;
                height: auto !important;
                width: auto !important;
                border: none !important;
                box-shadow: none !important;
              }
              .no-print {
                display: none !important;
                visibility: hidden !important;
              }
            }
          `}</style>
          
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col no-print-container">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-6 py-3 no-print">
              <div className="flex items-center gap-2">
                <FileText className="text-amber-400 w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider">Service Bill Invoice Preview</span>
              </div>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content - Scrollable Canvas */}
            <div className="p-8 overflow-y-auto flex-1 bg-slate-700 flex justify-center items-start no-print-content-wrapper">
              {/* White A4 Sheet */}
              <div 
                id="printable-invoice" 
                className="bg-white text-black p-8 shadow-2xl border border-black w-full max-w-[794px] min-h-[1123px] font-sans flex flex-col justify-between"
                style={{ boxSizing: 'border-box' }}
              >
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    
                    {/* Header Branding Box */}
                    <div className="border border-black p-4 flex items-center">
                      <div className="flex-grow text-center">
                        <img src={logo} alt="VELSON Logo" className="h-24 w-auto object-contain mx-auto" />
                        <div className="text-[11px] font-bold mt-1 uppercase tracking-wider">SP No 98/3A, Velson Valley</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider">Sankari RS, Nagichettypatti(P.O),</div>
                        <div className="text-[11px] font-bold uppercase tracking-wider">Sankari (TK), Salem-637302. Tamilnadu.</div>
                        <div className="text-[11px] font-bold">Ph: 8489339933</div>
                      </div>
                    </div>

                    {/* Customer & Quotation Info Box */}
                    <div className="border border-black p-4 flex justify-between items-center text-[12px] leading-relaxed">
                      <div className="w-1/3">
                        <div className="font-extrabold text-[12px] uppercase">Customer</div>
                        <div className="font-bold text-[12px] mt-0.5 uppercase">{previewBillData.partyName || 'N/A'}</div>
                        <div className="text-[11px] text-slate-500 mt-1 uppercase whitespace-pre-line">{previewBillData.address || ''}</div>
                      </div>
                      <div className="w-1/3 text-center">
                        <div className="text-md font-black tracking-widest uppercase">SERVICE INVOICE</div>
                      </div>
                      <div className="w-1/3 text-right font-bold space-y-1">
                        <div>
                          INVOICE No: <span className="font-normal">{previewBillData.refNo || 'N/A'}</span>
                        </div>
                        <div>
                          SERVICE No: <span className="font-normal">{previewBillData.serviceNo || 'N/A'}</span>
                        </div>
                        <div>
                          DATE: <span className="font-normal">{formatDate(previewBillData.billDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Items Grid Table */}
                    <table className="w-full text-left border-collapse border border-black text-[12px]">
                      <thead>
                        <tr className="border-b border-black font-bold align-middle" style={{ height: '30px', left: '0'}}>
                          <th className="border-r border-black px-2 py-1 text-center w-[6%]">S.No</th>
                          <th className="border-r border-black px-3 py-1 text-center w-[38%]">Description of Goods</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[8%]">Qty</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[8%]">UOM</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[12%]">Rate</th>
                          <th className="border-r border-black px-2 py-1 text-center w-[14%]">Labour Charge</th>
                          <th className="px-2 py-1 text-center w-[14%]">Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(previewBillData.items || []).map((row, index) => {
                          const rQty = Number(row.qty) || 0
                          const rRate = Number(row.rate) || 0
                          const rLabour = Number(row.labourCharge) || 0
                          const rTotal = (rQty * rRate) + rLabour
                          return (
                            <tr key={index} className="border-b border-black align-middle font-semibold" style={{ height: '35px' }}>
                              <td className="border-r border-black px-2 py-1 text-center">{row.slNo || (index + 1)}</td>
                              <td className="border-r border-black px-3 py-1 text-center uppercase">{row.itemName}</td>
                              <td className="border-r border-black px-2 py-1 text-center">{formatNumber(rQty, 2)}</td>
                              <td className="border-r border-black px-2 py-1 text-center uppercase">{row.uom || 'Nos'}</td>
                              <td className="border-r border-black px-2 py-1 text-right pr-4">{formatNumber(rRate, 2)}</td>
                              <td className="border-r border-black px-2 py-1 text-right pr-4">{formatNumber(rLabour, 2)}</td>
                              <td className="px-2 py-1 text-right pr-4 font-bold">{formatNumber(rTotal, 2)}</td>
                            </tr>
                          )
                        })}

                        {/* Continuous Vertical Lines Spacer Row */}
                        <tr style={{ height: '380px' }} className="align-top print-spacer">
                          <td className="border-r border-black px-2 py-2 w-[6%]"></td>
                          <td className="border-r border-black px-3 py-2 w-[38%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[8%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[8%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[12%]"></td>
                          <td className="border-r border-black px-2 py-2 w-[14%]"></td>
                          <td className="px-2 py-2 w-[14%]"></td>
                        </tr>

                        {/* Totals Block */}
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            Taxable Amount :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber(Number(previewBillData.materialCost || 0) + Number(previewBillData.labourCharge || 0), 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            CGST(9.00) % :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber((Number(previewBillData.materialCost || 0) + Number(previewBillData.labourCharge || 0)) * 0.09, 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            SGST(9.00) % :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold">
                            {formatNumber((Number(previewBillData.materialCost || 0) + Number(previewBillData.labourCharge || 0)) * 0.09, 2)}
                          </td>
                        </tr>
                        <tr className="border-t border-black font-bold bg-slate-50">
                          <td colSpan={6} className="border-r border-black text-right px-3 py-1.5 uppercase">
                            Grand Total :
                          </td>
                          <td className="text-right pr-4 py-1.5 font-bold text-[14px]">
                            {formatNumber(Number(previewBillData.billAmt || 0), 2)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 bg-slate-900 text-white no-print">
              <span className="text-[11px] text-slate-400 font-semibold">
                Use Ctrl+P or the Print button to print this page.
              </span>
              <div className="flex items-center gap-3">
                <button 
                  onClick={triggerBrowserPrint}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-bold rounded-lg transition-colors shadow-md active:scale-95"
                >
                  <Printer size={15} /> Print Invoice
                </button>
                <button 
                  onClick={() => setShowPreview(false)}
                  className="px-5 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[12px] font-bold rounded-lg transition-colors active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
