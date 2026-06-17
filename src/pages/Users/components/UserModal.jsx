import React from 'react';
import { X, Save, RotateCcw, Loader2 } from 'lucide-react';
import UserForm from './UserForm';

export default function UserModal({ 
  isOpen, 
  onClose, 
  title, 
  form, 
  sf, 
  errors, 
  isEditMode, 
  isSelf,
  saving, 
  onSubmit, 
  onClear 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0097A7] to-[#00BCD4] px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-[15px] uppercase tracking-wider">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors"
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content / Form */}
        <div className="p-5 max-h-[75vh] overflow-y-auto">
          <UserForm 
            form={form} 
            sf={sf} 
            errors={errors} 
            isEditMode={isEditMode} 
            isSelf={isSelf}
          />
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5">
          <button
            onClick={onClear}
            disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          
          <button
            onClick={onSubmit}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 bg-[#27ae60] hover:bg-[#229954] text-white text-[13px] font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> {isEditMode ? 'Update' : 'Create'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
