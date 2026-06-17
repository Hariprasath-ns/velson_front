import { AlertTriangle, X } from 'lucide-react'

export default function ConfirmDialog({ open, title = 'Confirm Delete', message = 'Are you sure you want to delete this record? This action cannot be undone.', onConfirm, onCancel, confirming = false }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={confirming ? undefined : onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-[440px] overflow-hidden animate-[scaleIn_0.2s_ease-out]">
        <div className="bg-gradient-to-r from-rose-500 to-red-600 px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-black text-[14px] uppercase tracking-wider">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="text-slate-600 text-[13px] leading-relaxed">{message}</p>
        </div>
        <div className="px-6 pb-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={confirming}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-bold rounded-lg transition-all border border-slate-200 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={confirming}
            className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white text-[12px] font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-70 flex items-center gap-2"
          >
            {confirming
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Deleting…</>
              : 'Yes, Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
