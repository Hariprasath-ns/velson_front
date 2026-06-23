import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell } from 'lucide-react'
import api from '../services/api'
import { getSocket } from '../services/socket'

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0)
  const navigate = useNavigate()

  // Fetch unread notifications count
  const fetchNotificationsCount = async () => {
    try {
      const res = await api.get('/api/notifications?status=unread&limit=1', { skipGlobalLoader: true })
      if (res.data?.success) {
        setUnreadCount(res.data.meta?.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch notifications count:', err)
    }
  }

  useEffect(() => {
    fetchNotificationsCount()

    // Setup Socket.IO listener for real-time notifications
    const socket = getSocket()
    
    const handleNotificationCreated = (notif) => {
      fetchNotificationsCount()

      // Trigger native toast event
      let toastType = 'info'
      if (['critical', 'error'].includes(notif.priority?.toLowerCase())) {
        toastType = 'error'
      } else if (notif.priority?.toLowerCase() === 'warning') {
        toastType = 'warning'
      } else if (notif.priority?.toLowerCase() === 'success') {
        toastType = 'success'
      }

      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          title: notif.title,
          message: notif.message,
          type: toastType
        }
      }))
    }

    const handleNotificationRead = () => {
      fetchNotificationsCount()
    }

    const handleLocalUpdate = () => {
      fetchNotificationsCount()
    }

    socket.on('notification.created', handleNotificationCreated)
    socket.on('notification.read', handleNotificationRead)
    window.addEventListener('notifications-updated', handleLocalUpdate)

    return () => {
      socket.off('notification.created', handleNotificationCreated)
      socket.off('notification.read', handleNotificationRead)
      window.removeEventListener('notifications-updated', handleLocalUpdate)
    }
  }, [])

  return (
    <button
      onClick={() => navigate('/users/notification-history')}
      className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors relative"
      title="Notifications"
    >
      <Bell size={15} className="text-white" />
      {unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}
