import api from './axios';

export const createColumn = async (data) => {
  const response = await api.post('/columns', data);
  return response.data;
};

export const updateColumn = async (columnId, data) => {
  const response = await api.put(`/columns/${columnId}`, data);
  return response.data;
};

export const deleteColumn = async (columnId) => {
  const response = await api.delete(`/columns/${columnId}`);
  return response.data;
};
