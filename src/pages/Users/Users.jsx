import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChevronRight, Plus } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useToast } from '../../components/Toast';

// Components
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserModal from './components/UserModal';

// Hooks, validation, utils, constants
import { useUsers } from './hooks/useUsers';
import { useUserPermissions } from './hooks/useUserPermissions';
import { validateUser } from './validation/userSchema';
import { sortUsers } from './utils/userSort';
import { DEFAULT_SORT, DEFAULT_PAGE_SIZE } from './constants/userConfig';

const emptyForm = {
  name: '',
  email: '',
  password: '',
  role: 'user',
  isActive: true
};

export default function Users() {
  const { auth } = useAuth();
  const currentUser = auth?.user;
  const toast = useToast();

  // Redirect if not admin
  if (!currentUser || currentUser.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Hook state
  const {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser
  } = useUsers();

  const { canDeleteUser, canDeactivateUser } = useUserPermissions(currentUser);

  // Component states
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState(DEFAULT_SORT);
  
  // Modal & Form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Reset to first page when search query or page size changes
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // Set field helper
  const sf = useCallback((key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: '' }));
  }, []);

  // Filter users
  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const q = search.toLowerCase();
    return users.filter(u => 
      String(u.name || '').toLowerCase().includes(q) ||
      String(u.email || '').toLowerCase().includes(q) ||
      String(u.role || '').toLowerCase().includes(q)
    );
  }, [users, search]);

  // Sort users
  const sortedUsers = useMemo(() => {
    return sortUsers(filteredUsers, sort.field, sort.direction);
  }, [filteredUsers, sort]);

  // Paginated users list
  const pagedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedUsers.slice(start, start + pageSize);
  }, [sortedUsers, page, pageSize]);

  // Click triggers
  const handleAddNewClick = useCallback(() => {
    setEditUser(null);
    setForm({ ...emptyForm });
    setErrors({});
    setIsModalOpen(true);
  }, []);

  const handleEditClick = useCallback((user) => {
    setEditUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '', // Never prefill passwords
      role: user.role || 'user',
      isActive: user.isActive ?? true
    });
    setErrors({});
    setIsModalOpen(true);
  }, []);

  const handleDeleteClick = useCallback((user) => {
    if (!canDeleteUser(user.id, user.email)) {
      toast.warning('You cannot delete your own account.');
      return;
    }
    setConfirmDelete(user);
  }, [canDeleteUser, toast]);

  // Modal actions
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditUser(null);
    setForm({ ...emptyForm });
    setErrors({});
  }, []);

  const handleFormClear = useCallback(() => {
    setForm(prev => ({
      ...emptyForm,
      name: editUser ? editUser.name : '',
      email: editUser ? editUser.email : '',
      role: editUser ? editUser.role : 'user',
      isActive: editUser ? editUser.isActive : true
    }));
    setErrors({});
  }, [editUser]);

  const handleSave = async () => {
    const isEdit = !!editUser;
    const { isValid, errors: valErrors } = validateUser(form, isEdit);
    
    if (!isValid) {
      setErrors(valErrors);
      return;
    }

    // Safety check: Self-Deactivation Protection
    if (isEdit && !canDeactivateUser(editUser.id, form.isActive, editUser.email)) {
      toast.warning('You cannot deactivate your own account.');
      return;
    }

    setSaving(true);
    let success = false;
    
    if (isEdit) {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive
      };
      if (form.password && form.password.trim()) {
        payload.password = form.password;
      }
      success = await updateUser(editUser.id, payload);
    } else {
      success = await createUser({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        isActive: form.isActive
      });
    }

    setSaving(false);
    if (success) {
      setIsModalOpen(false);
      setForm({ ...emptyForm });
      setEditUser(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const success = await deleteUser(confirmDelete.id);
    if (success) {
      setConfirmDelete(null);
    }
  };

  return (
    <div className="p-5 space-y-5 w-full min-w-0">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="hover:text-[#0097A7] cursor-pointer">Admin Settings</span>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#0097A7] font-semibold">User Management</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">User Masters</h1>
          <p className="text-[12px] text-slate-500">Manage database user roles, login credentials, and account statuses.</p>
        </div>
        
        <button
          onClick={handleAddNewClick}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#0097A7] hover:bg-[#007a87] text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="bg-white rounded border border-slate-200 shadow-sm">
        <UserFilters
          search={search}
          onSearchChange={setSearch}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
        
        <UserTable
          users={pagedUsers}
          totalEntries={filteredUsers.length}
          page={page}
          onPageChange={setPage}
          pageSize={pageSize}
          sort={sort}
          onSortChange={setSort}
          onEditClick={handleEditClick}
          onDeleteClick={handleDeleteClick}
          canDeleteUser={canDeleteUser}
          isDeletingId={loading ? (confirmDelete?.id ?? null) : null}
        />
      </div>

      <UserModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editUser ? 'Edit User Credentials' : 'Create New User Account'}
        form={form}
        sf={sf}
        errors={errors}
        isEditMode={!!editUser}
        isSelf={editUser && currentUser && Number(editUser.id) === Number(currentUser.id)}
        saving={saving}
        onSubmit={handleSave}
        onClear={handleFormClear}
      />

      <ConfirmDialog
        open={!!confirmDelete}
        title="Confirm User Deletion"
        message={`Are you sure you want to delete user account "${confirmDelete?.name}"? This will permanently remove their profile and database credentials.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}
