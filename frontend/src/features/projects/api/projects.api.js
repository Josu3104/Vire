import apiClient from '@/core/api/client';
import axios from 'axios';

export const getProjects = async (params) => {
  return apiClient.get('/projects', { params });
};

export const getProjectById = async (id) => {
  return apiClient.get(`/projects/${id}`);
};

export const requestPresignedUrl = async (fileName, mimeType, folder) => {
  // Postponed by user, but endpoint exists
  return apiClient.post('/projects/presign', { fileName, mimeType, folder });
};

export const directS3Upload = async (url, file) => {
  // For now just resolve since real upload is postponed
  return Promise.resolve({ status: 200, message: 'Mock file upload successful' });
};

export const createProject = async (projectData) => {
  return apiClient.post('/projects', projectData);
};

export const voteProject = async (id, isUpvote) => {
  return apiClient.post(`/projects/${id}/vote`, { isUpvote });
};

export const commentProject = async (id, text) => {
  return apiClient.post(`/projects/${id}/comments`, { text });
};

export const deleteProject = async (id) => {
  return apiClient.delete(`/projects/${id}`);
};

export const getTrendingTags = async () => {
  return apiClient.get('/projects/trending-tags');
};

export const getFilters = async () => {
  return apiClient.get('/projects/filters');
};
