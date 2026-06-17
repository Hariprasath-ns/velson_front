import React from 'react';
import { Search } from 'lucide-react';

export default function UserFilters({ 
  search, 
  onSearchChange, 
  pageSize, 
  onPageSizeChange,
  pageSizes = [5, 10, 25, 50]
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-2 text-[13px] text-slate-600">
        <span className="font-semibold">Search:</span>
        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search users..."
            className="border border-slate-300 rounded pl-8 pr-3 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] w-48 shadow-sm transition-all"
          />
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-[13px] text-slate-600">
        <span>Show</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="border border-slate-300 rounded px-2 py-1 text-[13px] focus:outline-none focus:ring-1 focus:ring-[#0097A7] bg-white cursor-pointer"
        >
          {pageSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
        <span>entries</span>
      </div>
    </div>
  );
}
