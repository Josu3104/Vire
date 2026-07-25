import apiClient from '@/core/api/client';

export const getInbox = async () => {
  return apiClient.get('/chat/inbox');
};

export const getHistory = async (id) => {
  return apiClient.get(`/chat/${id}/history`);
};

export const startChat = async (targetUserId) => {
  return apiClient.post('/chat/room', { targetUserId });
};

export const getUnreadChatCount = async () => {
  return apiClient.get('/chat/unread-count');
};

export const markChatAsRead = async (chatId) => {
  return apiClient.put(`/chat/${chatId}/read`);
};
