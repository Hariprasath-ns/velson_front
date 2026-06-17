import { useState, useEffect } from 'react'
import { ChevronRight, ChevronLeft, X, CheckCircle2, XCircle, Loader2, FileText } from 'lucide-react'
import { useToast } from '../components/Toast'
import api from '../services/api'

const fmtDate = (d) => {
  if (!d) return '—'
  try {
    const date = new Date(d)
    if (isNaN(date.getTime())) return d
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return d
  }
}

export default function MRApproval() {
  const toast = useToast()

  const [rows, setRows] = useState([])
  const [itemsData, setItemsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedRowId, setSelectedRowId] = useState(null)
  const [activeItemCode, setActiveItemCode] = useState(null)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/material-request', { skipGlobalLoader: true })
      setRows(res.data?.data || [])
    } catch {
      toast.error('Failed to load material requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
    api.get('/api/item-master?limit=10000', { skipGlobalLoader: true })
      .then(r => setItemsData(r.data?.data || []))
      .catch(() => {})
  }, [])

  const selectedMR = rows.find(r => r.id === selectedRowId)

  // Reset active item code when selected request changes
  useEffect(() => {
    if (selectedMR && selectedMR.details && selectedMR.details.length > 0) {
      setActiveItemCode(selectedMR.details[0].itemCode)
    } else {
      setActiveItemCode(null)
    }
  }, [selectedRowId, selectedMR])

  const handleUpdateStatus = async (newStatus) => {
    if (!selectedMR) return

    try {
      const payload = {
        departmentTo: selectedMR.departmentTo,
        requestingUser: selectedMR.requestingUser,
        team: selectedMR.team,
        requestingFor: selectedMR.requestingFor,
        requestDate: selectedMR.requestDate,
        requiredDate: selectedMR.requiredDate,
        requiredDays: selectedMR.requiredDays,
        storeName: selectedMR.storeName,
        bomPartName: selectedMR.bomPartName,
        vehicleName: selectedMR.vehicleName,
        remarks: selectedMR.remarks,
        status: newStatus,
        items: selectedMR.details || []
      }

      await api.put(`/api/material-request/${selectedMR.id}`, payload)
      
      // Update local state status
      setRows(prev => prev.map(r => r.id === selectedRowId ? { ...r, status: newStatus } : r))
      
      if (newStatus === 'Approved') {
        toast.success(`Material Request ${selectedMR.mrNo} approved.`)
      } else {
        toast.warning(`Material Request ${selectedMR.mrNo} rejected.`)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status')
    }
  }

  // Get image for active item code
  const getPartImage = () => {
    if (!activeItemCode) return null
    const master = itemsData.find(it => it.partNo === activeItemCode)
    if (!master) return null
    return master.hasImage ? `/api/item-master/${master.id}/download-image` : (master.imagePath || null)
  }

  const partImage = getPartImage()

  const pendingCount  = rows.filter(r => r.status === 'Pending').length
  const approvedCount = rows.filter(r => r.status === 'Approved').length
  const rejectedCount = rows.filter(r => r.status === 'Rejected').length

  const reqColor = (r) => {
    if (r === 'PRODUCTION') return 'text-sky-700 font-bold'
    if (r === 'SALES') return 'text-emerald-700 font-bold'
    return 'text-slate-600'
  }

  const userColor = (u = '') => {
    const l = u.toLowerCase()
    if (l.includes('velson') || l.includes('spares')) return 'text-emerald-600'
    if (l.includes('electrical')) return 'text-amber-600'
    if (l.includes('gas') || l.includes('cutting')) return 'text-orange-600'
    if (l.includes('v10') || l.includes('groundhog')) return 'text-blue-600'
    return 'text-slate-600'
  }

  return (
    <div className="bg-[#f4f6f8] min-h-full pb-6">
      <div className="px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-[12px] text-slate-400 mb-5 uppercase font-bold tracking-tight">
          <span>Technical</span><ChevronRight size={12} />
          {selectedMR ? (
            <>
              <span className="hover:text-[#0097A7] cursor-pointer" onClick={() => setSelectedRowId(null)}>MR Approval</span>
              <ChevronRight size={12} />
              <span className="text-[#0097A7]">{selectedMR.mrNo}</span>
            </>
          ) : (
            <span className="text-[#0097A7]">MR Approval</span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-700 rounded-sm" />
              <h2 className="text-[13px] font-bold text-slate-700 uppercase tracking-tight">
                {selectedMR ? `Material Request Details — ${selectedMR.mrNo}` : 'Material Request Approval Pending'}
              </h2>
            </div>
            {selectedMR ? (
              <button 
                onClick={() => setSelectedRowId(null)}
                className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] font-bold rounded transition-colors"
              >
                <ChevronLeft size={14} /> Back to List
              </button>
            ) : (
              <button className="text-slate-400 hover:text-red-600 transition-colors" onClick={() => window.history.back()}>
                <X size={20} strokeWidth={2.5} />
              </button>
            )}
          </div>

          <div className="p-4 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <Loader2 className="w-8 h-8 text-[#0097A7] animate-spin" />
                <span className="text-sm font-semibold text-slate-500">Loading requests...</span>
              </div>
            ) : rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <FileText className="w-12 h-12 text-slate-300" />
                <span className="text-sm font-semibold text-slate-400">No Material Requests found</span>
              </div>
            ) : !selectedMR ? (
              /* --- LIST PANEL VIEW --- */
              <div className="space-y-4">
                {/* Stats Bar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center justify-between">
                  <p className="text-[12px] font-bold text-slate-500 uppercase tracking-wide">Material Request List</p>
                  {/* <div className="flex items-center gap-3 text-[11px] font-bold">
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5 text-amber-700">
                      <span className="w-2 h-2 bg-amber-400 rounded-full" />
                      <span>{pendingCount} Pending</span>
                    </div>
                    <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 text-emerald-700">
                      <CheckCircle2 size={13} className="text-emerald-500" />
                      <span>{approvedCount} Approved</span>
                    </div>
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-red-600">
                      <XCircle size={13} className="text-red-400" />
                      <span>{rejectedCount} Rejected</span>
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase hidden md:inline">{rows.length} total requests</span>
                  </div> */}
                </div>

                {/* Table */}
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[900px]">
                      <thead className="sticky top-0 z-10 bg-[#4472C4] text-white text-[11px] uppercase font-bold">
                        <tr>
                          <th className="px-3 py-2.5 border-r border-blue-400 w-44">Req_No</th>
                          <th className="px-3 py-2.5 border-r border-blue-400 w-28 text-center">Req Date</th>
                          <th className="px-3 py-2.5 border-r border-blue-400 w-36">Dept Name</th>
                          <th className="px-3 py-2.5 border-r border-blue-400 w-28 text-center">Required Date</th>
                          <th className="px-3 py-2.5 border-r border-blue-400 w-28">Request For</th>
                          <th className="px-3 py-2.5">Created User</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-[12px]">
                        {rows.filter(r => r.status === 'Pending').map((r, i) => {
                          const isApproved = r.status === 'Approved'
                          const isRejected = r.status === 'Rejected'

                          const rowBg = isApproved ? 'bg-emerald-50/60 hover:bg-emerald-100/40'
                            : isRejected ? 'bg-red-50/60 hover:bg-red-100/40'
                            : i % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-100/50'

                          return (
                            <tr key={r.id} onClick={() => setSelectedRowId(r.id)}
                              className={`h-10 transition-colors cursor-pointer ${rowBg}`}>
                              <td className="px-3 py-1.5 border-r border-slate-100 font-bold text-[#0097A7]">{r.mrNo}</td>
                              <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-500">{fmtDate(r.requestDate)}</td>
                              <td className="px-3 py-1.5 border-r border-slate-100 font-semibold text-slate-600">{r.departmentTo || '—'}</td>
                              <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-500">{fmtDate(r.requiredDate)}</td>
                              <td className={`px-3 py-1.5 border-r border-slate-100 ${reqColor(r.requestingFor)}`}>{r.requestingFor || '—'}</td>
                              <td className={`px-3 py-1.5 ${userColor(r.createdBy || r.requestingUser)}`}>{r.createdBy || r.requestingUser || '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Footer */}
                  <div className="flex items-center border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold text-slate-500">
                    <span>Row : {rows.filter(r => r.status === 'Pending').length}</span>
                  </div>
                </div>
              </div>
            ) : (
              /* --- DETAILED FORM PANEL VIEW --- */
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
                {/* Title & Status */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 bg-[#0097A7] rounded-full animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-700 uppercase">Material Request Detail Form</h3>
                  </div>
                  <div>
                    {selectedMR.status === 'Pending' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full uppercase">
                        Pending Approval
                      </span>
                    )}
                    {selectedMR.status === 'Approved' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full uppercase">
                        Approved
                      </span>
                    )}
                    {selectedMR.status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full uppercase">
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* 3-Column Form Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                  {/* Column 1 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[110px] shrink-0">Temp Request No :</label>
                      <input value={selectedMR.tempRequestNo || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[110px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Dept To :
                      </label>
                      <input value={selectedMR.departmentTo || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[110px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Request User :
                      </label>
                      <input value={selectedMR.requestingUser || selectedMR.createdBy || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[110px] shrink-0">Team :</label>
                      <input value={selectedMR.team || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[110px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Request For :
                      </label>
                      <input value={selectedMR.requestingFor || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[105px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Request No :
                      </label>
                      <input value={selectedMR.mrNo || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-700 font-bold focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[105px] shrink-0">Request Date :</label>
                      <input value={fmtDate(selectedMR.requestDate)} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[105px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Required Date :
                      </label>
                      <input value={fmtDate(selectedMR.requiredDate)} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[105px] shrink-0">
                        <span className="text-red-500 font-bold mr-0.5">*</span>Required Day's :
                      </label>
                      <input value={selectedMR.requiredDays || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[105px] shrink-0">Vehicle Name :</label>
                      <input value={selectedMR.vehicleName || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                  </div>

                  {/* Column 3: Part Image & BOM */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[100px] shrink-0">BOM Part Name :</label>
                      <input value={selectedMR.bomPartName || ''} readOnly className="w-full border border-slate-200 rounded px-2 py-1 text-[12px] bg-slate-50 text-slate-600 focus:outline-none" />
                    </div>
                    <div className="flex items-start gap-2">
                      <label className="text-[11px] font-bold text-slate-500 w-[100px] shrink-0 pt-1">Part Image :</label>
                      <div className="flex-1 h-[95px] border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-center overflow-hidden">
                        {partImage ? (
                          <img src={partImage} alt="Part Preview" className="h-full w-full object-contain" />
                        ) : (
                          <span className="text-[10px] text-slate-400 text-center p-2">Select an item in grid to view image</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items grid */}
                <div className="mt-4">
                  <div className="bg-slate-700 px-3 py-1.5 rounded-t-lg">
                    <h4 className="text-white text-[12px] font-bold">Items List</h4>
                  </div>
                  <div className="overflow-x-auto border border-slate-200 rounded-b-lg bg-white">
                    <table className="w-full text-left border-collapse text-[11.5px]">
                      <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                        <tr>
                          <th className="px-2 py-2 border-r border-slate-200 w-10 text-center">ID</th>
                          <th className="px-3 py-2 border-r border-slate-200">Model Name</th>
                          <th className="px-3 py-2 border-r border-slate-200">Code</th>
                          <th className="px-3 py-2 border-r border-slate-200">Item Name</th>
                          <th className="px-3 py-2 border-r border-slate-200 text-center">Qty</th>
                          <th className="px-3 py-2 border-r border-slate-200">Grade</th>
                          <th className="px-3 py-2 border-r border-slate-200 text-center">Unit</th>
                          <th className="px-3 py-2">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(!selectedMR.details || selectedMR.details.length === 0) ? (
                          <tr>
                            <td colSpan={8} className="text-center py-8 text-slate-400 italic">No items found.</td>
                          </tr>
                        ) : (
                          selectedMR.details.map((d, index) => {
                            const isActive = activeItemCode === d.itemCode
                            return (
                              <tr key={d.id || index}
                                onClick={() => setActiveItemCode(d.itemCode)}
                                className={`cursor-pointer hover:bg-slate-50/50 ${isActive ? 'bg-blue-50/60 font-semibold text-slate-800' : ''}`}>
                                <td className="px-2 py-1.5 border-r border-slate-100 text-center font-bold text-slate-400">{index + 1}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 text-slate-600">{d.modelName || '—'}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 font-mono text-[11px] text-[#0097A7]">{d.itemCode || '—'}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 text-slate-700">{d.itemName || '—'}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 text-center font-bold">{d.requestedQty || 0}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 text-slate-600">{d.materialGrade || '—'}</td>
                                <td className="px-3 py-1.5 border-r border-slate-100 text-center text-slate-500">{d.unit || '—'}</td>
                                <td className="px-3 py-1.5 text-slate-500 truncate max-w-[120px]">{d.remarks || '—'}</td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Remarks */}
                <div className="mt-4 flex items-start gap-3">
                  <label className="text-[11px] font-bold text-slate-500 w-16 shrink-0 pt-1">Remarks :</label>
                  <textarea
                    readOnly
                    value={selectedMR.remarks || ''}
                    rows={2}
                    className="w-full border border-slate-200 rounded-lg p-2 text-[12px] bg-slate-50 focus:outline-none resize-none text-slate-600"
                  />
                </div>

                {/* Actions Section */}
                <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
                  <button 
                    onClick={() => setSelectedRowId(null)}
                    className="flex items-center gap-1 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[12px] font-bold rounded-lg transition-colors"
                  >
                    <ChevronLeft size={15} /> Back to List
                  </button>
                  {selectedMR.status === 'Pending' ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleUpdateStatus('Approved')}
                        className="flex items-center gap-1.5 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[12px] font-bold rounded-lg transition-all active:scale-95 shadow-md"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus('Rejected')}
                        className="flex items-center gap-1.5 px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-[12px] font-bold rounded-lg transition-all active:scale-95 shadow-md"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  ) : selectedMR.status === 'Approved' ? (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-700 font-bold text-[12px]">
                      <CheckCircle2 size={14} /> Approved
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 font-bold text-[12px]">
                      <XCircle size={14} /> Rejected
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
