import { useState, useEffect, Fragment } from 'react'
import { ChevronRight, ChevronDown, Search, X, Clock, CheckCircle2, XCircle, Eye, Ban, Loader2 } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const formatDate = (dateInput) => {
  if (!dateInput) return '—';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (e) {
    return dateInput;
  }
};

const formatDateTime = (dateObj) => {
  if (!dateObj) return '—';
  const pad = (num) => String(num).padStart(2, '0')
  const d = dateObj.getDate()
  const m = dateObj.getMonth() + 1
  const y = dateObj.getFullYear()
  const h = dateObj.getHours()
  const min = dateObj.getMinutes()
  const s = dateObj.getSeconds()
  return `${pad(d)}/${pad(m)}/${y} ${pad(h)}:${pad(min)}:${pad(s)}`
}

const Input = ({ placeholder, value, onChange, className = "" }) => (
  <input type="text" placeholder={placeholder} value={value} onChange={onChange}
    className={`px-3 py-[6px] text-[12px] border border-slate-300 rounded bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7]/25 focus:border-[#0097A7] transition-all ${className}`} />
)

export default function WaitingForApproval() {
  const toast = useToast()
  const { auth } = useAuth()
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState([])
  const [processes, setProcesses] = useState([])
  const [selectedRow, setSelectedRow] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const pageSize = 13

  // Cancellation Modal State
  const [cancelJob, setCancelJob] = useState(null)
  const [cancelReason, setCancelReason] = useState('')

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState({})

  const fetchAllData = async () => {
    try {
      const [jobsRes, procRes] = await Promise.all([
        api.get('/api/job-card', { loadingMessage: 'Loading waiting list...' }),
        api.get('/api/process-master', { skipGlobalLoader: true })
      ])
      
      const dbJobs = jobsRes.data?.data || []
      const dbProcesses = procRes.data?.data || []
      setProcesses(dbProcesses)
      
      const formatted = dbJobs.map(jc => {
        const planDateStr = formatDate(jc.currentDate);
        const requiredDateStr = formatDate(jc.requiredDate);
        
        const appDate = jc.approvedDate ? formatDateTime(new Date(jc.approvedDate)) : null;
        const rejDate = jc.rejectedDate ? formatDateTime(new Date(jc.rejectedDate)) : null;
        const canDate = jc.cancelledDate ? formatDateTime(new Date(jc.cancelledDate)) : null;
        
        const defaultIndex = (jc.lineItems && jc.lineItems.length > 0) ? 0 : -1;

        return {
          id: `db-${jc.id}`,
          jobCardId: jc.id,
          jobNo: jc.jobNo,
          vehicleType: jc.model || '—',
          planDate: planDateStr,
          requiredDate: requiredDateStr,
          note: jc.note || '',
          status: jc.status || 'Pending',
          approved: jc.status === 'Approved',
          rejected: jc.status === 'Rejected',
          cancelled: jc.status === 'Cancelled',
          approvedDate: appDate,
          rejectedDate: rejDate,
          cancelledDate: canDate,
          cancellationReason: jc.cancellationReason || null,
          lineItems: jc.lineItems || [],
          activeLineItemIndex: defaultIndex,
          originalJobCard: jc
        };
      });
      
      setJobs(formatted)
    } catch (err) {
      console.error('Error fetching WaitingForApproval data:', err)
      toast.error('Failed to load data')
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  const handleActiveItemChange = (jobId, index) => {
    setJobs(prev => prev.map(j => j.id === jobId ? { ...j, activeLineItemIndex: Number(index) } : j));
  }

  const handleApprove = async (jobCardId, jobNo) => {
    try {
      const payload = {
        status: 'Approved',
        approvedDate: new Date().toISOString(),
        approvedBy: auth?.user?.name || 'Administrator',
        rejectedDate: null,
        cancelledDate: null,
        cancellationReason: null
      };
      
      await api.put(`/api/job-card/${jobCardId}`, payload, { loadingMessage: 'Approving Job Card...' })
      toast.success(`Job #${jobNo} approved successfully.`)
      await fetchAllData()
    } catch (err) {
      console.error('Error approving Job Card:', err)
      toast.error('Failed to approve job card')
    }
  }

  const handleReject = async (jobCardId, jobNo) => {
    try {
      const payload = {
        status: 'Rejected',
        approvedDate: null,
        approvedBy: null,
        rejectedDate: new Date().toISOString(),
        cancelledDate: null,
        cancellationReason: null
      };
      
      await api.put(`/api/job-card/${jobCardId}`, payload, { loadingMessage: 'Rejecting Job Card...' })
      toast.warning(`Job #${jobNo} rejected.`)
      await fetchAllData()
    } catch (err) {
      console.error('Error rejecting Job Card:', err)
      toast.error('Failed to reject job card')
    }
  }

  const handleCancelSubmit = async (jobCardId, jobNo) => {
    if (!cancelReason.trim()) return
    try {
      const payload = {
        status: 'Cancelled',
        approvedDate: null,
        approvedBy: null,
        rejectedDate: null,
        cancelledDate: new Date().toISOString(),
        cancellationReason: cancelReason.trim()
      };
      
      await api.put(`/api/job-card/${jobCardId}`, payload, { loadingMessage: 'Cancelling Job Card...' })
      toast.error(`Job #${jobNo} has been cancelled.`)
      setCancelJob(null)
      setCancelReason('')
      await fetchAllData()
    } catch (err) {
      console.error('Error cancelling Job Card:', err)
      toast.error('Failed to cancel job card')
    }
  }

  // Filter logic: combining search and status filter
  const filtered = jobs.filter(j => {
    // 1. Status filter
    if (statusFilter === 'PENDING' && j.status !== 'Pending') return false
    if (statusFilter === 'APPROVED' && j.status !== 'Approved') return false
    if (statusFilter === 'REJECTED' && j.status !== 'Rejected') return false
    if (statusFilter === 'CANCELLED' && j.status !== 'Cancelled') return false

    // 2. Search query filter
    if (!search) return true
    const q = search.toLowerCase()
    const matchesLineItems = j.lineItems.some(li => 
      (li.partNo || '').toLowerCase().includes(q) || 
      (li.partName || '').toLowerCase().includes(q)
    );

    return String(j.jobNo).toLowerCase().includes(q) ||
      j.vehicleType.toLowerCase().includes(q) ||
      matchesLineItems;
  })

  const pendingCount = jobs.filter(j => j.status === 'Pending').length
  const approvedCount = jobs.filter(j => j.status === 'Approved').length
  const rejectedCount = jobs.filter(j => j.status === 'Rejected').length
  const cancelledCount = jobs.filter(j => j.status === 'Cancelled').length

  // Pagination calculation
  const totalPages = Math.ceil(filtered.length / pageSize)
  const pagedJobs = filtered.slice((page - 1) * pageSize, page * pageSize)

  // Dynamic column visibility settings based on active filter
  const showApprovedCol = statusFilter === 'APPROVED'
  const showRejectedCol = statusFilter === 'REJECTED'
  const showCancelledCol = statusFilter === 'CANCELLED'
  const showReasonCol = statusFilter === 'CANCELLED'

  // Calculate table min-width dynamically based on visible columns to maintain readability
  const activeDateColsCount = (showApprovedCol ? 1 : 0) + (showRejectedCol ? 1 : 0) + (showCancelledCol ? 1 : 0) + (showReasonCol ? 1.5 : 0)
  const minTableWidth = Math.max(900, 900 + activeDateColsCount * 130)

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-4">
      <div className="px-4 py-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-3 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={11} />
          <span className="text-[#0097A7]">Waiting For Approval</span>
        </div>

        <div className="mt-5 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-amber-500 rounded-sm" />
              <h2 className="text-[12.5px] font-bold text-slate-700 uppercase tracking-tight">
                Waiting For Approval Job List
              </h2>
            </div>
            <button className="text-slate-400 hover:text-red-600 transition-colors"><X size={18} strokeWidth={2.5} /></button>
          </div>

          <div className="p-3 space-y-3">
            {/* ── Search bar & Filters ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold text-slate-600 uppercase whitespace-nowrap">Search :</span>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Job No / Vehicle Type / Part No / Part Name..."
                    className="pl-8 w-72"
                  />
                </div>
                {search && (
                  <button onClick={() => setSearch('')} className="text-[11px] text-[#0097A7] hover:text-[#007a87] font-bold transition-colors">Clear</button>
                )}
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => { setStatusFilter('ALL'); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all active:scale-95 ${statusFilter === 'ALL'
                      ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                >
                  All ({jobs.length})
                </button>
                <button
                  onClick={() => { setStatusFilter('PENDING'); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all active:scale-95 flex items-center gap-1 ${statusFilter === 'PENDING'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200'
                    }`}
                >
                  <Clock size={11} />
                  {pendingCount} Pending
                </button>
                <button
                  onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all active:scale-95 flex items-center gap-1 ${statusFilter === 'APPROVED'
                      ? 'bg-[#2ecc71] text-white border-[#2ecc71] shadow-sm'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                    }`}
                >
                  <CheckCircle2 size={11} />
                  {approvedCount} Approved
                </button>
                <button
                  onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all active:scale-95 flex items-center gap-1 ${statusFilter === 'REJECTED'
                      ? 'bg-[#e74c3c] text-white border-[#e74c3c] shadow-sm'
                      : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                    }`}
                >
                  <XCircle size={11} />
                  {rejectedCount} Rejected
                </button>
                <button
                  onClick={() => { setStatusFilter('CANCELLED'); setPage(1); }}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded border transition-all active:scale-95 flex items-center gap-1 ${statusFilter === 'CANCELLED'
                      ? 'bg-slate-500 text-white border-slate-500 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                >
                  <Ban size={11} />
                  {cancelledCount} Cancelled
                </button>
              </div>
            </div>

            {/* ── Table ── */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse" style={{ minWidth: `${minTableWidth}px` }}>
                  <thead>
                    <tr className="bg-[#1565C0] text-white text-[11px] uppercase font-bold">
                      <th className="px-4 py-2 border-r border-blue-400 w-16 bg-[#1565C0]">J.No</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-28 bg-[#1565C0]">Vehicle Type</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-28 bg-[#1565C0]">Part No</th>
                      <th className="px-3 py-2 border-r border-blue-400 bg-[#1565C0]">Part Name</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-16 text-center bg-[#1565C0]">Qty/V</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-24 text-center bg-[#1565C0]">Plan Date</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-24 text-center bg-[#1565C0]">Required Date</th>
                      <th className="px-3 py-2 border-r border-blue-400 w-32 bg-[#1565C0]">Note</th>
                      {showApprovedCol && <th className="px-3 py-2 border-r border-blue-400 w-40 text-center bg-[#1565C0]">Approved Date</th>}
                      {showRejectedCol && <th className="px-3 py-2 border-r border-blue-400 w-40 text-center bg-[#1565C0]">Rejected Date</th>}
                      {showCancelledCol && <th className="px-3 py-2 border-r border-blue-400 w-40 text-center bg-[#1565C0]">Cancelled Date</th>}
                      {showReasonCol && <th className="px-3 py-2 border-r border-blue-400 w-48 bg-[#1565C0]">Reason</th>}
                      <th className="px-3 py-2 text-center bg-[#1565C0] w-48">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedJobs.length === 0 ? (
                      <tr>
                        <td colSpan={9 + (showApprovedCol ? 1 : 0) + (showRejectedCol ? 1 : 0) + (showCancelledCol ? 1 : 0) + (showReasonCol ? 1 : 0)} className="py-16 text-center text-slate-300">
                          <Clock size={36} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
                          <p className="text-[12px] font-bold uppercase tracking-widest">No jobs found</p>
                          <p className="text-[11px] text-slate-400 mt-1">Try adjusting search or filters</p>
                        </td>
                      </tr>
                    ) : (
                      pagedJobs.map((j, i) => {
                        const isSelected = selectedRow === j.jobNo
                        const isExpanded = !!expandedRows[j.id]
                        const rowBg = j.approved
                          ? 'bg-emerald-50/60'
                          : j.rejected
                            ? 'bg-red-50/60'
                            : j.cancelled
                              ? 'bg-slate-50/80'
                              : isSelected
                                ? 'bg-[#1565C0]/8'
                                : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'

                        const activeIndex = j.activeLineItemIndex;
                        const hasLineItems = j.lineItems && j.lineItems.length > 0;
                        const activeItem = hasLineItems && activeIndex >= 0 ? j.lineItems[activeIndex] : null;

                        const partNoVal = activeItem ? activeItem.partNo : '—';
                        const partNameVal = activeItem ? activeItem.partName : '—';
                        const qtyVal = activeItem ? (activeItem.planQty || 0) : (j.qtyV || 0);

                        const itemProcesses = processes
                          .filter(p => p.PM_Part_Name && partNameVal && p.PM_Part_Name.toLowerCase().trim() === partNameVal.toLowerCase().trim())
                          .sort((a, b) => Number(a.PM_Process_Order || 0) - Number(b.PM_Process_Order || 0));

                        return (
                          <Fragment key={j.id}>
                            <tr
                              onClick={() => {
                                setSelectedRow(j.jobNo)
                                setExpandedRows(prev => ({ ...prev, [j.id]: !prev[j.id] }))
                              }}
                              className={`h-9 transition-colors cursor-pointer hover:bg-blue-50/40 ${rowBg}`}
                            >
                              <td className="px-3 py-1 border-r border-slate-100 text-[12px] font-bold text-slate-700">{j.jobNo}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-[12px] font-semibold text-slate-600">{j.vehicleType}</td>
                              
                              {/* Part No Column */}
                              <td className="px-3 py-1 border-r border-slate-100 text-[11px] font-mono text-[#0097A7]">
                                {j.lineItems.length > 1 ? (
                                  <select
                                    value={j.activeLineItemIndex}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => {
                                      e.stopPropagation();
                                      handleActiveItemChange(j.id, e.target.value);
                                    }}
                                    className="px-2 py-0.5 border border-slate-200 rounded bg-white focus:outline-none text-[11px] text-[#0097A7] font-mono cursor-pointer max-w-[130px]"
                                  >
                                    {j.lineItems.map((li, idx) => (
                                      <option key={li.id || idx} value={idx}>{li.partNo}</option>
                                    ))}
                                  </select>
                                ) : (
                                  partNoVal
                                )}
                              </td>

                              {/* Part Name Column */}
                              <td className="px-3 py-1 border-r border-slate-100 text-[12px] text-slate-700 max-w-[280px]">
                                <div className="flex items-center gap-1.5 w-full">
                                  {itemProcesses.length > 0 && (
                                    <span className="text-[#0097A7] hover:text-[#007a87] transition-colors shrink-0">
                                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                    </span>
                                  )}
                                  
                                  {j.lineItems.length > 1 ? (
                                    <select
                                      value={j.activeLineItemIndex}
                                      onClick={e => e.stopPropagation()}
                                      onChange={e => {
                                        e.stopPropagation();
                                        handleActiveItemChange(j.id, e.target.value);
                                      }}
                                      className="flex-1 min-w-0 px-2 py-0.5 border border-slate-200 rounded bg-white focus:outline-none text-[12px] text-slate-700 cursor-pointer truncate max-w-[240px]"
                                    >
                                      {j.lineItems.map((li, idx) => (
                                        <option key={li.id || idx} value={idx}>{li.partName}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <span title={partNameVal} className="truncate">{partNameVal}</span>
                                  )}
                                </div>
                              </td>

                              <td className="px-3 py-1 border-r border-slate-100 text-center text-[12px] font-bold text-slate-600">{qtyVal}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500">{j.planDate}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500">{j.requiredDate}</td>
                              <td className="px-3 py-1 border-r border-slate-100 text-[11px] text-slate-400 italic">{j.note || '—'}</td>
                              {showApprovedCol && (
                                <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                                  {j.approvedDate || '—'}
                                </td>
                              )}
                              {showRejectedCol && (
                                <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                                  {j.rejectedDate || '—'}
                                </td>
                              )}
                              {showCancelledCol && (
                                <td className="px-3 py-1 border-r border-slate-100 text-center text-[11px] text-slate-500 font-medium">
                                  {j.cancelledDate || '—'}
                                </td>
                              )}
                              {showReasonCol && (
                                <td className="px-3 py-1 border-r border-slate-100 text-[11px] text-slate-500 truncate max-w-[200px]" title={j.cancellationReason}>
                                  {j.cancellationReason || '—'}
                                </td>
                              )}
                              <td className="px-3 py-1 text-center">
                                {j.approved ? (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                                      <CheckCircle2 size={11} /> Approved
                                    </span>
                                    <button
                                      onClick={e => { e.stopPropagation(); setCancelJob(j); }}
                                      className="flex items-center gap-1 px-1.5 py-0.5 bg-[#f39c12] hover:bg-[#d35400] text-white text-[10px] font-bold rounded transition-all active:scale-95 shadow-sm"
                                    >
                                      <Ban size={10} /> Cancel
                                    </button>
                                  </div>
                                ) : j.rejected ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">
                                    <XCircle size={11} /> Rejected
                                  </span>
                                ) : j.cancelled ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full uppercase">
                                    <Ban size={11} /> Cancelled
                                  </span>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <button
                                      onClick={e => { e.stopPropagation(); handleApprove(j.jobCardId, j.jobNo) }}
                                      className="flex items-center gap-1 px-2 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-bold rounded transition-all active:scale-95 shadow-sm"
                                    >
                                      <CheckCircle2 size={11} /> Approve
                                    </button>
                                    <button
                                      onClick={e => { e.stopPropagation(); handleReject(j.jobCardId, j.jobNo) }}
                                      className="flex items-center gap-1 px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold rounded transition-all active:scale-95 shadow-sm"
                                    >
                                      <XCircle size={11} /> Reject
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>

                            {/* Collapsible Process Sequence Table */}
                            {isExpanded && (
                              <tr className="bg-slate-50/50">
                                <td colSpan={9 + (showApprovedCol ? 1 : 0) + (showRejectedCol ? 1 : 0) + (showCancelledCol ? 1 : 0) + (showReasonCol ? 1 : 0)} className="px-6 py-3">
                                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 overflow-x-auto">
                                    <div className="flex items-center gap-2 mb-3">
                                      <Clock size={14} className="text-[#0097A7]" />
                                      <h4 className="text-[12px] font-bold text-slate-700 uppercase tracking-wide">
                                        Process Sequence for Part: <span className="text-[#0097A7]">{partNameVal}</span>
                                      </h4>
                                    </div>
                                    
                                    {itemProcesses.length === 0 ? (
                                      <p className="text-[11px] text-slate-400 italic">No process sequence entered in Process Master for this part.</p>
                                    ) : (
                                      <table className="w-full text-left border-collapse text-[11px]">
                                        <thead>
                                          <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200">
                                            <th className="px-3 py-1.5 text-center w-16">Order</th>
                                            <th className="px-3 py-1.5">Process Name</th>
                                            <th className="px-3 py-1.5">Team</th>
                                            <th className="px-3 py-1.5">Machine Name</th>
                                            <th className="px-3 py-1.5 text-center">Duration</th>
                                            <th className="px-3 py-1.5 text-center">Setting Time</th>
                                            <th className="px-3 py-1.5 text-center">Cycle Time</th>
                                            <th className="px-3 py-1.5 text-center">Handling Time</th>
                                            <th className="px-3 py-1.5 text-center">Idle Time</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                          {itemProcesses.map((proc, pidx) => {
                                            const durationParts = [];
                                            if (proc.PM_Days && proc.PM_Days !== '0') durationParts.push(`${proc.PM_Days}d`);
                                            if (proc.PM_Hours && proc.PM_Hours !== '0') durationParts.push(`${proc.PM_Hours}h`);
                                            if (proc.Minutes && proc.Minutes !== '0') durationParts.push(`${proc.Minutes}m`);
                                            const durationStr = durationParts.join(' ') || '—';
                                            
                                            return (
                                              <tr key={proc.id || pidx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-3 py-1.5 text-center font-bold text-[#0097A7]">{proc.PM_Process_Order}</td>
                                                <td className="px-3 py-1.5 font-semibold text-slate-700">{proc.PM_Process_Name}</td>
                                                <td className="px-3 py-1.5 text-slate-600">{proc.TeamId || '—'}</td>
                                                <td className="px-3 py-1.5 text-slate-600">{proc.Machine_Name ? `${proc.Machine_Name} (${proc.Machine_Code})` : '—'}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-600 font-medium">{durationStr}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-500">{proc.Setting_Time ? `${proc.Setting_Time} min` : '—'}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-500">{proc.Cycle_Time ? `${proc.Cycle_Time} min` : '—'}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-500">{proc.Handling_Time ? `${proc.Handling_Time} min` : '—'}</td>
                                                <td className="px-3 py-1.5 text-center text-slate-500">{proc.Idle_Time ? `${proc.Idle_Time} min` : '—'}</td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer with dynamic Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 py-1 pt-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1}–{Math.min(page * pageSize, filtered.length)} of {filtered.length} records
              </span>

              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      className={`w-6 h-6 text-[11px] rounded border font-bold transition-colors ${page === n
                          ? 'bg-[#1565C0] text-white border-[#1565C0] shadow-sm'
                          : 'border-slate-300 hover:bg-slate-50 text-slate-600'
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-2 py-1 text-[11px] font-bold border border-slate-300 rounded hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Cancellation Reason Modal */}
      {cancelJob !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden transform transition-all scale-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 flex items-center justify-between text-white">
              <h3 className="font-bold text-[14px] uppercase tracking-wide flex items-center gap-2">
                <Ban size={16} /> Cancellation Reason Required
              </h3>
              <button
                onClick={() => { setCancelJob(null); setCancelReason(''); }}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please enter the reason for cancellation..."
                  rows={4}
                  className="w-full px-3 py-2 text-[12px] border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all placeholder-slate-400 text-slate-800 resize-none"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => { setCancelJob(null); setCancelReason(''); }}
                className="px-4 py-2 border border-slate-300 rounded text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition-colors uppercase tracking-wider"
              >
                Close
              </button>
              <button
                onClick={() => handleCancelSubmit(cancelJob.jobCardId, cancelJob.jobNo)}
                disabled={!cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-[11px] font-bold rounded shadow transition-all active:scale-95 uppercase tracking-wider"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}