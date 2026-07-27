import apiClient from '@/core/api/client';

export const searchUsers = async (query) => {
  return apiClient.get(`/users/search?q=${encodeURIComponent(query)}`);
};

export const getTopEngineers = async () => {
  return apiClient.get('/users/top');
};

export const getUserById = async (id) => {
  return apiClient.get(`/users/${id}`);
};

export const requestMembershipValidation = async () => {
  return apiClient.post('/users/request-membership-validation');
};
