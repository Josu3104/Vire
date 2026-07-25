// import apiClient from '@/core/api/client';

export const storageApi = {
  uploadFile: async (file, type, onProgress) => {
    return new Promise((resolve) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 20;
        if (onProgress) onProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          resolve({ data: { url: `http://mock-storage.com/${file.name}` } });
        }
      }, 100);
    });
  },
};
