import React from 'react';
import { getStatusLabel } from '../utils/userHelpers';

export default function UserStatusBadge({ isActive }) {
  const label = getStatusLabel(isActive);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
        ${isActive 
          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
          : 'bg-red-100 text-red-800 border border-red-200'
        }`}
    >
      {label}
    </span>
  );
}
