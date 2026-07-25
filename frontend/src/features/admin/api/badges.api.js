import apiClient from '@/core/api/client';

export const requestBadge = async (formData) => {
  return apiClient.post('/badges/request', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const getMyBadges = async () => {
  return apiClient.get('/badges/my-badges');
};
