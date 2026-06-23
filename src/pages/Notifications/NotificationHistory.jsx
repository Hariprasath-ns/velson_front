import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  Search, Check, MailOpen, Calendar, AlertOctagon, AlertTriangle, CheckCircle, Info, ChevronLeft, ChevronRight, Trash2
} from 'lucide-react'
import api from '../../services/api'

export default function NotificationHistory() {
  const navigate = useNavigate()
  const { auth } = useAuth()
  const isAdmin = auth?.user?.role?.toUpperCase() === 'ADMIN' || auth?.user?.id === 0

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const [selectedNotif, setSelectedNotif] = useState(null)
  const [showModal, setShowModal] = useState(false)

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        status,
        priority,
        search
      })
      const res = await api.get(`/api/notifications?${queryParams.toString()}`)
      if (res.data?.success) {
        setNotifications(res.data.data)
        setTotalPages(res.data.meta.totalPages)
        setTotalCount(res.data.meta.total)
      }
    } catch (err) {
      console.error('Failed to load notification history:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [page, status, priority])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setPage(1)
    fetchHistory()
  }

  const handleMarkAsRead = async (id) => {
    try {
      const res = await api.put(`/api/notifications/${id}/read`)
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
        window.dispatchEvent(new CustomEvent('notifications-updated'))
      }
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const res = await api.put('/api/notifications/read-all')
      if (res.data?.success) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() })))
        window.dispatchEvent(new CustomEvent('notifications-updated'))
      }
    } catch (err) {
      console.error('Failed to mark all notifications read:', err)
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await api.delete(`/api/notifications/${id}`)
      if (res.data?.success) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        window.dispatchEvent(new CustomEvent('notifications-updated'))
      }
    } catch (err) {
      console.error('Failed to delete notification:', err)
    }
  }

  const getPriorityBadge = (priorityVal) => {
    let styles = ''
    let icon = null
    switch (priorityVal?.toLowerCase()) {
      case 'critical':
        styles = 'bg-red-100 text-red-800 border-red-200'
        icon = <AlertOctagon size={11} />
        break
      case 'error':
        styles = 'bg-orange-100 text-orange-800 border-orange-200'
        icon = <AlertTriangle size={11} />
        break
      case 'warning':
        styles = 'bg-yellow-100 text-yellow-800 border-yellow-200'
        icon = <AlertTriangle size={11} />
        break
      case 'success':
        styles = 'bg-green-100 text-green-800 border-green-200'
        icon = <CheckCircle size={11} />
        break
      default:
        styles = 'bg-blue-100 text-blue-800 border-blue-200'
        icon = <Info size={11} />
    }

    return (
      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-bold uppercase border ${styles}`}>
        {icon}
        {priorityVal}
      </span>
    )
  }

  const handleViewRecord = (notif) => {
    if (notif.referenceType === "MaterialIssueHeader") {
      navigate('/material-issue')
    } else if (notif.referenceType === "StockAdjustment") {
      navigate('/stock-adjustment')
    } else if (notif.referenceType === "ServiceSpare") {
      navigate('/service-spare-entry')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">Notification Center</h1>
          <p className="text-[12px] text-slate-500 mt-1">Review alerts, updates, and messages from various departments.</p>
        </div>
        
        <button
          onClick={handleMarkAllAsRead}
          className="self-start sm:self-auto px-3.5 py-2 text-[12px] font-bold text-white bg-[#0097A7] hover:bg-[#00838F] rounded-lg transition-all shadow-sm flex items-center gap-1.5"
        >
          <Check size={14} /> Mark All As Read
        </button>
      </div>

      {/* Filters & Search */}
      <form onSubmit={handleSearchSubmit} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-12 gap-3.5 items-end">
        <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Search</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search by title or content..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/50"
            />
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
          </div>
        </div>

        <div className="col-span-6 md:col-span-3 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/50 bg-white"
          >
            <option value="all">All (Read & Unread)</option>
            <option value="unread">Unread Only</option>
            <option value="read">Read Only</option>
          </select>
        </div>

        <div className="col-span-6 md:col-span-3 flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</label>
          <select
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-[12px] focus:outline-none focus:ring-2 focus:ring-[#0097A7]/50 bg-white"
          >
            <option value="all">All Priorities</option>
            <option value="Info">Info</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div className="col-span-12 md:col-span-1">
          <button
            type="submit"
            className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold text-[12px] py-2 rounded-lg transition-colors border border-slate-800"
          >
            Filter
          </button>
        </div>
      </form>

      {/* Notifications List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading history...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <MailOpen size={36} className="text-slate-300" />
            <h3 className="text-slate-800 font-bold text-[13px] uppercase mt-2">No Notifications Found</h3>
            <p className="text-[11px] text-slate-400">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors hover:bg-slate-50/50 ${!notif.isRead ? 'bg-slate-50/30' : ''}`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-450 uppercase tracking-widest bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {notif.config?.module || 'System'}
                  </span>
                  <span className="text-[9.5px] font-semibold text-slate-455 uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                    {notif.config?.action || 'Event'}
                  </span>
                  {getPriorityBadge(notif.priority)}
                  {!notif.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                  )}
                </div>
                
                <h3 className="text-[12.5px] font-bold text-slate-800">{notif.title}</h3>
                <p className="text-[11.5px] text-slate-650 leading-relaxed">{notif.message}</p>
                
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10.5px] text-slate-500 font-medium">
                  {notif.metadata?.actorContext?.userName && (
                    <span>By: <span className="font-semibold text-slate-800">{notif.metadata.actorContext.userName} ({notif.metadata.actorContext.role})</span></span>
                  )}
                  {notif.metadata?.actorContext?.department && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Dept: <span className="font-semibold text-slate-800">{notif.metadata.actorContext.department}</span></span>
                    </>
                  )}
                  {notif.metadata?.actorContext?.ipAddress && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>IP: <span className="font-semibold text-slate-800">{notif.metadata.actorContext.ipAddress}</span></span>
                    </>
                  )}
                  {notif.referenceNumber && (
                    <>
                      <span className="text-slate-300">•</span>
                      <span>Ref: <span className="font-bold text-[#0097A7]">{notif.referenceNumber}</span></span>
                    </>
                  )}
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1">
                    <Calendar size={11} className="text-slate-400" />
                    <span>{new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setSelectedNotif(notif); setShowModal(true); }}
                  className="px-2.5 py-1.5 text-[10.5px] font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded transition-all"
                >
                  View Details
                </button>
                {!notif.isRead && (
                  <button
                    onClick={() => handleMarkAsRead(notif.id)}
                    className="px-2.5 py-1.5 text-[10.5px] font-bold text-[#0097A7] hover:bg-[#0097A7]/10 rounded border border-[#0097A7]/25 transition-all flex items-center gap-1"
                    title="Mark as Read"
                  >
                    <Check size={12} /> Mark Read
                  </button>
                )}
                <button
                  onClick={() => handleDelete(notif.id)}
                  className="p-1.5 text-rose-600 hover:bg-rose-50 rounded border border-rose-200/25 transition-all flex items-center justify-center"
                  title="Delete Notification"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-[12px]">
          <span className="text-slate-500">
            Showing Page <span className="font-bold text-slate-800">{page}</span> of <span className="font-bold text-slate-800">{totalPages}</span> ({totalCount} total alerts)
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Activity Details Modal */}
      {showModal && selectedNotif && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[100vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-150 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                Activity Details
              </h3>
              <button 
                onClick={() => { setShowModal(false); setSelectedNotif(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-[11.5px] text-slate-750">
              <div className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[9px] font-extrabold uppercase bg-[#0097A7]/10 text-[#0097A7] px-2 py-0.5 rounded border border-[#0097A7]/10">
                    {selectedNotif.config?.module || 'System'}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                    {selectedNotif.config?.action || 'ACTION'}
                  </span>
                  {getPriorityBadge(selectedNotif.priority)}
                </div>
                <h4 className="text-[12.5px] font-extrabold text-slate-950">{selectedNotif.title}</h4>
                <p className="text-[12px] text-slate-600 mt-1 leading-relaxed">{selectedNotif.message}</p>
              </div>

              {/* Grid Metadata */}
              <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">User Name</span>
                  <span className="font-semibold text-slate-800">{selectedNotif.metadata?.actorContext?.userName || 'System'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Email Address</span>
                  <span className="font-semibold text-slate-800">{selectedNotif.metadata?.actorContext?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Role</span>
                  <span className="font-semibold text-slate-850">{selectedNotif.metadata?.actorContext?.role || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Department</span>
                  <span className="font-semibold text-slate-855">{selectedNotif.metadata?.actorContext?.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Reference Number</span>
                  <span className="font-bold text-[#0097A7]">{selectedNotif.referenceNumber || 'None'}</span>
                </div>
                <div>
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block">Timestamp</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(selectedNotif.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Summary of Changes */}
              {selectedNotif.metadata?.summaryOfChanges && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <span className="text-[9.5px] font-bold text-slate-400 uppercase block mb-1">Summary of Changes</span>
                  <span className="font-medium text-slate-700 leading-normal">{selectedNotif.metadata.summaryOfChanges}</span>
                </div>
              )}

              {/* Sensitive Info (Admin Only) */}
              {isAdmin && selectedNotif.metadata?.actorContext && (
                <div className="bg-amber-50/50 border border-amber-200/50 rounded-lg p-3 space-y-2">
                  <span className="text-[9.5px] font-extrabold text-amber-800 uppercase block tracking-wider">Device & Session Data (Sensitive - Admin Only)</span>
                  <div className="grid grid-cols-2 gap-2 text-[10.5px]">
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[8.5px]">IP Address</span>
                      <span className="font-mono text-slate-700 font-bold">{selectedNotif.metadata.actorContext.ipAddress || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-bold uppercase block text-[8.5px]">Session ID</span>
                      <span className="font-mono text-slate-750 max-w-[150px] truncate block" title={selectedNotif.metadata.actorContext.sessionId}>
                        {selectedNotif.metadata.actorContext.sessionId || 'Unknown'}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 font-bold uppercase block text-[8.5px]">Device Specs</span>
                      <span className="text-slate-700 font-semibold">
                        {selectedNotif.metadata.actorContext.os || 'Unknown OS'} • {selectedNotif.metadata.actorContext.browser || 'Unknown Browser'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              {selectedNotif.referenceType && (
                <button
                  onClick={() => {
                    setShowModal(false);
                    handleViewRecord(selectedNotif);
                  }}
                  className="px-4 py-2 bg-[#0097A7] hover:bg-[#00838F] text-white font-bold text-[11px] rounded-lg transition-all"
                >
                  View Record
                </button>
              )}
              <button
                onClick={() => { setShowModal(false); setSelectedNotif(null); }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold text-[11px] rounded-lg transition-all"
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
