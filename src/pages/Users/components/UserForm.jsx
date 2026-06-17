import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { ROLES } from '../utils/userConstants';

export default function UserForm({ form, sf, errors, isEditMode, isSelf }) {
  const [showPassword, setShowPassword] = useState(false);

  const inputClass = (hasError) =>
    `w-full border rounded px-3 py-2 text-[13px] focus:outline-none focus:ring-1 transition-colors bg-white ${
      hasError 
        ? 'border-red-400 focus:ring-red-300' 
        : 'border-slate-300 focus:ring-[#0097A7] focus:border-[#0097A7]'
    }`;

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-1">
          <span className="text-red-500">*</span> Full Name
        </label>
        <input
          type="text"
          value={form.name || ''}
          onChange={(e) => sf('name', e.target.value)}
          placeholder="Enter full name"
          className={inputClass(errors.name)}
        />
        {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-1">
          <span className="text-red-500">*</span> Email Address
        </label>
        <input
          type="email"
          value={form.email || ''}
          onChange={(e) => sf('email', e.target.value)}
          placeholder="Enter email address"
          className={inputClass(errors.email)}
          autoComplete="username"
        />
        {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-1">
          {!isEditMode && <span className="text-red-500">*</span>} Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password || ''}
            onChange={(e) => sf('password', e.target.value)}
            placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password'}
            className={inputClass(errors.password)}
            autoComplete="new-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-[11px] text-red-500 mt-1">{errors.password}</p>}
      </div>

      {/* Role */}
      <div>
        <label className="block text-[12.5px] font-semibold text-slate-600 mb-1">
          <span className="text-red-500">*</span> User Role
        </label>
        <select
          value={form.role || ROLES.USER}
          onChange={(e) => sf('role', e.target.value)}
          className={inputClass(errors.role) + (isSelf ? ' opacity-60 cursor-not-allowed bg-slate-50' : '')}
          disabled={isSelf}
        >
          <option value={ROLES.USER}>User (Operational)</option>
          <option value={ROLES.STAFF}>Staff (Staff Level)</option>
          <option value={ROLES.ADMIN}>Admin (Full Control)</option>
        </select>
        {isSelf && <p className="text-[11px] text-slate-400 mt-1">You cannot change your own role.</p>}
        {errors.role && <p className="text-[11px] text-red-500 mt-1">{errors.role}</p>}
      </div>

      {/* Active Status Toggle */}
      <div className={`flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg ${isSelf ? 'opacity-60' : ''}`}>
        <div>
          <h4 className="text-[13px] font-bold text-slate-700">Account Active Status</h4>
          <p className="text-[11.5px] text-slate-500">
            {isSelf ? 'You cannot deactivate your own account.' : 'Disabled users will be blocked from logging in.'}
          </p>
        </div>
        <label className={`relative inline-flex items-center ${isSelf ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
          <input
            type="checkbox"
            checked={form.isActive ?? true}
            onChange={(e) => !isSelf && sf('isActive', e.target.checked)}
            disabled={isSelf}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0097A7]"></div>
        </label>
      </div>
    </div>
  );
}
