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

export const directS3Upload = (url, file, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const percentCompleted = Math.round((event.loaded * 100) / event.total);
        onProgress(percentCompleted);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.responseText);
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload aborted'));
    });

    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
    xhr.send(file);
  });
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

export const updateProjectStatus = async (id, status, rejectionReason = null) => {
  return apiClient.patch(`/projects/${id}/status`, { status, rejectionReason });
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

export const getMyProjects = async () => {
  return apiClient.get('/projects/me');
};

export const updateProject = async (id, projectData) => {
  return apiClient.put(`/projects/${id}`, projectData);
};
