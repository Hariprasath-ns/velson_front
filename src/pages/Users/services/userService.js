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
