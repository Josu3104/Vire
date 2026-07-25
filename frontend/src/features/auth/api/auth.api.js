import apiClient from '@/core/api/client';

export const login = async (email, password) => {
  return apiClient.post("/auth/login",{email,password});
};

export const register = async (data) => {
  return apiClient.post("/auth/register",data);
};

export const logout = async () => {
    localStorage.clear();
  return Promise.resolve({ message: 'Mock logout success' });

};

export const getProfile = async () => {
  return apiClient.get("/users/me",{});
};

export const updateProfile = async (data) => {
  return apiClient.put("users/me/profile",data)
};
