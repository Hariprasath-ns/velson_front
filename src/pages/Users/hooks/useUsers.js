import { useState, useCallback } from 'react';
import * as userService from '../services/userService';
import { useToast } from '../../../components/Toast';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.getUsers();
      setUsers(response.data?.data || []);
    } catch (err) {
      console.error('[useUsers] fetchUsers:', err);
      const errMsg = err?.response?.data?.error || 'Failed to load users';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const createUser = useCallback(async (userData) => {
    setLoading(true);
    try {
      const response = await userService.createUser(userData);
      const newUser = response.data?.data;
      if (newUser) {
        await fetchUsers();
        toast.success('User created successfully.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[useUsers] createUser:', err);
      const errMsg = err?.response?.data?.error || 'Failed to create user';
      toast.error(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  const updateUser = useCallback(async (id, userData) => {
    setLoading(true);
    try {
      const response = await userService.updateUser(id, userData);
      const updatedUser = response.data?.data;
      if (updatedUser) {
        await fetchUsers();
        toast.success('User updated successfully.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('[useUsers] updateUser:', err);
      const errMsg = err?.response?.data?.error || 'Failed to update user';
      toast.error(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  const deleteUser = useCallback(async (id) => {
    setLoading(true);
    try {
      await userService.deleteUser(id);
      await fetchUsers();
      toast.success('User deleted successfully.');
      return true;
    } catch (err) {
      console.error('[useUsers] deleteUser:', err);
      const errMsg = err?.response?.data?.error || 'Failed to delete user';
      toast.error(errMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers, toast]);

  return {
    users,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
