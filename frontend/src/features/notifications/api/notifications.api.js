import apiClient from '@/core/api/client';

export const getNotifications = async () => {
  return apiClient.get('/notifications');
};

export const markAsRead = async (id) => {
  return apiClient.patch(`/notifications/${id}/read`);
};

export const markAllAsRead = async () => {
  return apiClient.patch('/notifications/read-all');
};

export const getUnreadNotificationCount = async () => {
  return apiClient.get('/notifications/unread-count');
};
