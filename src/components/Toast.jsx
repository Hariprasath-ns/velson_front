import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  warning: <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />,
  success: <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />,
  error: <XCircle size={18} className="text-red-500 flex-shrink-0" />,
  info: <Info size={18} className="text-sky-500 flex-shrink-0" />,
}

const STYLES = {
  warning: 'border-amber-300 bg-amber-50',
  success: 'border-emerald-300 bg-emerald-50',
  error: 'border-red-300 bg-red-50',
  info: 'border-sky-300 bg-sky-50',
}

const PROGRESS = {
  warning: 'bg-amber-400',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
  info: 'bg-sky-400',
}

function ToastItem({ toast, onRemove }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(() => onRemove(toast.id), 300)
    }, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [toast, onRemove])

  return (
    <div
      className={`relative flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-sm min-w-[320px] max-w-[420px] transition-all duration-300 ${STYLES[toast.type] || STYLES.info} ${exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'}`}
      style={{ animation: exiting ? 'none' : 'slideIn 0.3s ease-out' }}
    >
      {ICONS[toast.type] || ICONS.info}
      <div className="flex-1 min-w-0 pt-[1px]">
        {toast.title && (
          <p className="text-[12px] font-bold text-slate-800 mb-0.5">{toast.title}</p>
        )}
        <p className="text-[12px] text-slate-600 leading-relaxed">{toast.message}</p>
      </div>
      <button
        onClick={() => { setExiting(true); setTimeout(() => onRemove(toast.id), 300) }}
        className="text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0 mt-0.5"
      >
        <X size={14} />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-xl overflow-hidden">
        <div
          className={`h-full ${PROGRESS[toast.type] || PROGRESS.info} rounded-b-xl`}
          style={{ animation: `shrink ${toast.duration || 3500}ms linear forwards` }}
        />
      </div>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'warning', title = '', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => {
      // 1. Prevent duplicate toast messages from displaying concurrently
      if (prev.some(t => t.message === message)) {
        return prev
      }
      // 2. If there is an active "Network Error" toast, suppress other error toasts
      if (type === 'error' && prev.some(t => t.message === 'Network Error')) {
        return prev
      }
      return [...prev, { id, message, type, title, duration }]
    })
  }, [])

  const toast = useCallback({
    warning: (msg, title) => addToast(msg, 'warning', title || 'Required Field'),
    success: (msg, title) => addToast(msg, 'success', title || 'Success'),
    error: (msg, title) => addToast(msg, 'error', title || 'Error'),
    info: (msg, title) => addToast(msg, 'info', title || 'Info'),
  }, [addToast])

  useEffect(() => {
    const handleEvent = (e) => {
      const { message, type, title, duration } = e.detail || {}
      addToast(message, type, title, duration)
    }
    window.addEventListener('app-toast', handleEvent)
    return () => window.removeEventListener('app-toast', handleEvent)
  }, [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes shrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
