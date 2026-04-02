import api from './axios';

export const getBoards = async () => {
  const response = await api.get('/boards');
  return response.data;
};

export const createBoard = async (boardData) => {
  const response = await api.post('/boards', boardData);
  return response.data;
};

export const getBoardFull = async (boardId) => {
  const response = await api.get(`/boards/${boardId}/full`);
  return response.data;
};

export const updateBoard = async (boardId, data) => {
  const response = await api.put(`/boards/${boardId}`, data);
  return response.data;
};

export const deleteBoard = async (boardId) => {
  const response = await api.delete(`/boards/${boardId}`);
  return response.data;
};

export const inviteUser = async (boardId, email) => {
  const response = await api.post(`/boards/${boardId}/invite`, { email });
  return response.data;
};