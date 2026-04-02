import api from "./axios";

export const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export const signupUser = async (data) => {
  const response = await api.post("/auth/signup", data);
  return response.data;
};