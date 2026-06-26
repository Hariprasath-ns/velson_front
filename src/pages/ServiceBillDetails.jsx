import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, X, Search, FileBarChart, Edit2, Trash2, Printer, 
  FileSpreadsheet, FileText, Filter, Settings, Download
} from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

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

  const [fromDate, setFromDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 30) // Default to last 30 days
    return d.toISOString().split('T')[0]
  })
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0])
  const [searchPartyName, setSearchPartyName] = useState('')
  const [bills, setBills] = useState([])
  const [selectedBillId, setSelectedBillId] = useState(null)

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
                disabled={!selectedBillId}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-[11px] font-bold rounded-md transition-all shadow-sm group ${!selectedBillId ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-slate-600'}`}
              >
                <Edit2 size={14} className="text-[#0097A7] group-hover:scale-110 transition-transform" /> Edit
              </button>
              <button 
                onClick={handleDelete}
                disabled={!selectedBillId}
                className={`flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-rose-50 text-[11px] font-bold rounded-md transition-all shadow-sm group ${!selectedBillId ? 'opacity-50 cursor-not-allowed text-slate-400' : 'text-rose-600'}`}
              >
                <Trash2 size={14} className="group-hover:scale-110 transition-transform" /> Delete
              </button>
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
              <button className="flex items-center gap-1.5 hover:text-rose-600 transition-colors group" title="Pdf">
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
                      { label: 'Bill Amt', w: 'w-32' }
                    ].map((h, i) => (
                      <th key={i} className={`px-3 py-3 border-r border-slate-300 whitespace-nowrap ${h.w}`}>{h.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="text-center py-10 text-slate-400 font-semibold uppercase italic">
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
                        <td className="px-3 py-2 border-r border-slate-100">{bill.refNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100 font-medium text-[#0097A7]">{bill.serviceNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100">{bill.serviceJobNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100">{bill.vehicleNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100">{bill.serialNo}</td>
                        <td className="px-3 py-2 border-r border-slate-100">{formatDate(bill.billDate)}</td>
                        <td className="px-3 py-2 border-r border-slate-100">{bill.taxType}</td>
                        <td className="px-3 py-2 border-r border-slate-100 uppercase">{bill.partyName}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right pr-4 tabular-nums">₹{formatNumber(bill.materialCost)}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right pr-4 tabular-nums">₹{formatNumber(bill.labourCharge)}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-center">{bill.gstPer}%</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right pr-4 tabular-nums">₹{formatNumber(bill.gstAmt)}</td>
                        <td className="px-3 py-2 border-r border-slate-100 text-right pr-4 font-bold text-slate-800 tabular-nums">₹{formatNumber(bill.billAmt)}</td>
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
    </div>
  )
}
