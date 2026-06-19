import api from '../../../services/api';

export const getUsers = () => {
  return api.get('/api/users');
};

export const createUser = (data) => {
  return api.post('/api/users', data);
};

export const updateUser = (id, data) => {
  return api.put(`/api/users/${id}`, data);
};

export const deleteUser = (id) => {
  return api.delete(`/api/users/${id}`);
};

export const getUserPermissions = (userId) => {
  return api.get(`/api/users/${userId}/permissions`);
};

export const updateUserPermissions = (userId, permissions) => {
  return api.put(`/api/users/${userId}/permissions`, { permissions });
};

export const getRolePermissions = (roleName) => {
  return api.get(`/api/roles/${encodeURIComponent(roleName)}/permissions`);
};

export const updateRolePermissions = (roleName, permissions) => {
  return api.put(`/api/roles/${encodeURIComponent(roleName)}/permissions`, { permissions });
};
