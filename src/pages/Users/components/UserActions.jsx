import React from 'react';
import { Edit, Trash2, Shield } from 'lucide-react';

export default function UserActions({ onEdit, onDelete, onManageAccess, canDelete, isDeleting }) {
  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={onManageAccess}
        className="px-3 py-1.5 bg-[#475569] hover:bg-slate-700 text-white text-[12px] rounded transition-colors"
        title="Rights Assignment"
      >
        <Shield className="w-4 h-4" />
      </button>

      <button
        onClick={onEdit}
        className="px-3 py-1.5 bg-[#0097A7] hover:bg-[#007a87] text-white text-[12px] rounded transition-colors"
        title="Edit User"
      >
        <Edit className="w-4 h-4" />
      </button>
      
      <button
        onClick={onDelete}
        disabled={isDeleting || !canDelete}
        className={`px-3 py-1.5 text-white text-[12px] rounded transition-colors
          ${!canDelete 
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
            : 'bg-red-500 hover:bg-red-600'
          }`}
        title={canDelete ? "Delete User" : "You cannot delete your own account."}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
