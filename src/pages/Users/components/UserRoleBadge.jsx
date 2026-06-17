import React from 'react';
import { getRoleLabel } from '../utils/userHelpers';

export default function UserRoleBadge({ role }) {
  const label = getRoleLabel(role);
  let colorClass = 'bg-slate-100 text-slate-700 border border-slate-200';
  
  if (role === 'admin') {
    colorClass = 'bg-[#E0F7FA] text-[#006064] border border-[#B2EBF2]';
  } else if (role === 'staff') {
    colorClass = 'bg-purple-100 text-purple-800 border border-purple-200';
  }
  
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${colorClass}`}
    >
      {label}
    </span>
  );
}
