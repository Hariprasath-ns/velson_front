import React from 'react';
import { ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import UserStatusBadge from './UserStatusBadge';
import UserRoleBadge from './UserRoleBadge';
import UserActions from './UserActions';
import { formatDate } from '../utils/userHelpers';

export default function UserTable({
  users,
  totalEntries,
  page,
  onPageChange,
  pageSize,
  sort,
  onSortChange,
  onEditClick,
  onDeleteClick,
  canDeleteUser,
  isDeletingId
}) {
  const totalPages = Math.max(1, Math.ceil(totalEntries / pageSize));

  const renderSortIndicator = (field) => {
    if (sort.field !== field) {
      return <ArrowUpDown size={12} className="opacity-40 group-hover:opacity-75 transition-opacity" />;
    }
    return sort.direction === 'asc' 
      ? <ChevronUp size={12} className="text-[#0097A7] font-bold" />
      : <ChevronDown size={12} className="text-[#0097A7] font-bold" />;
  };

  const handleHeaderClick = (field) => {
    let direction = 'asc';
    if (sort.field === field) {
      direction = sort.direction === 'asc' ? 'desc' : 'asc';
    }
    onSortChange({ field, direction });
  };

  const pageNums = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const ps = [1];
    if (page > 3) ps.push('...');
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
      ps.push(i);
    }
    if (page < totalPages - 2) ps.push('...');
    ps.push(totalPages);
    return ps;
  };

  const headers = [
    { label: 'S.No', field: null, sortable: false, width: '7%' },
    { label: 'Name', field: 'name', sortable: true, width: '25%' },
    { label: 'Email', field: 'email', sortable: true, width: '25%' },
    { label: 'Role', field: 'role', sortable: true, width: '15%' },
    { label: 'Created On', field: 'createdAt', sortable: true, width: '13%' },
    { label: 'Status', field: 'isActive', sortable: false, width: '10%' },
    { label: 'Actions', field: null, sortable: false, width: '10%' }
  ];

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="min-w-full text-[13px] table-fixed">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {headers.map(h => (
                <th 
                  key={h.label} 
                  style={{ width: h.width }}
                  className={`px-3 py-3 font-semibold text-slate-600 text-[12.5px] uppercase tracking-wider text-center select-none
                    ${h.sortable ? 'cursor-pointer hover:bg-slate-100/70 group' : ''}`}
                  onClick={() => h.sortable && handleHeaderClick(h.field)}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <span>{h.label}</span>
                    {h.sortable && renderSortIndicator(h.field)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className="text-center py-12 text-slate-400 font-medium">
                  No user records found
                </td>
              </tr>
            ) : (
              users.map((row, idx) => {
                const sNo = (page - 1) * pageSize + idx + 1;
                const canDelete = canDeleteUser(row.id, row.email);
                
                return (
                  <tr 
                    key={row.id} 
                    className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors
                      ${idx % 2 === 1 ? 'bg-slate-50/30' : ''}`}
                  >
                    <td className="px-3 py-2.5 text-center text-slate-500 font-medium">{sNo}</td>
                    <td className="px-3 py-2.5 text-center font-semibold text-slate-800 break-words">{row.name}</td>
                    <td className="px-3 py-2.5 text-center font-medium text-slate-600 break-words">{row.email}</td>
                    <td className="px-3 py-2.5 text-center">
                      <UserRoleBadge role={row.role} />
                    </td>
                    <td className="px-3 py-2.5 text-center text-slate-600 font-mono text-[12px]">
                      {formatDate(row.createdAt)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <UserStatusBadge isActive={row.isActive} />
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <UserActions 
                        onEdit={() => onEditClick(row)}
                        onDelete={() => onDeleteClick(row)}
                        canDelete={canDelete}
                        isDeleting={isDeletingId === row.id}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalEntries > 0 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50">
          <span className="text-[12px] text-slate-500 font-medium">
            Showing {totalEntries === 0 ? 0 : (page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalEntries)} of {totalEntries} entries
          </span>
          
          <div className="flex items-center gap-1">
            <button 
              onClick={() => onPageChange(p => Math.max(1, p - 1))} 
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] font-semibold border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              Previous
            </button>
            
            {pageNums().map((n, i) =>
              n === '...' ? (
                <span key={`ell-${i}`} className="px-2 text-slate-400 text-[12px] select-none">…</span>
              ) : (
                <button 
                  key={n} 
                  onClick={() => onPageChange(n)}
                  className={`w-8 h-8 text-[12px] font-bold rounded-lg border transition-colors
                    ${page === n 
                      ? 'bg-[#0097A7] text-white border-[#0097A7] shadow-sm' 
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-600'
                    }`}
                >
                  {n}
                </button>
              )
            )}
            
            <button 
              onClick={() => onPageChange(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] font-semibold border border-slate-300 rounded-lg bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
