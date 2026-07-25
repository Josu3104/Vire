import apiClient from '@/core/api/client';

export const getBadgeRequests = async () => {
  return apiClient.get('/badges/requests');
};

export const approveBadge = async (id) => {
  return apiClient.post(`/badges/requests/${id}/approve`);
};

export const denyBadge = async (id, rejectionReason) => {
  return apiClient.post(`/badges/requests/${id}/deny`, { rejectionReason });
};

export const getPendingUsers = async () => {
  return apiClient.get('/users/pending');
};

export const approveUser = async (id) => {
  return apiClient.post(`/users/${id}/approve`);
};
