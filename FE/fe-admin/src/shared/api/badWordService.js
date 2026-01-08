import apiClient from './apiClient';

/**
 * Bad Word Service - API calls for bad word management
 */

// Get all bad words
export const getBadWords = async () => {
  return apiClient.get('/api/badword');
};

// Get bad word by ID
export const getBadWordById = async (id) => {
  return apiClient.get(`/api/badword/${id}`);
};

// Create new bad word
export const createBadWord = async (data) => {
  return apiClient.post('/api/badword', data);
};

// Update bad word
export const updateBadWord = async (id, data) => {
  return apiClient.put(`/api/badword/${id}`, data);
};

// Delete bad word
export const deleteBadWord = async (id) => {
  return apiClient.delete(`/api/badword/${id}`);
};

// Reload cache
export const reloadBadWordCache = async () => {
  return apiClient.post('/api/badword/reload-cache');
};

export default {
  getBadWords,
  getBadWordById,
  createBadWord,
  updateBadWord,
  deleteBadWord,
  reloadBadWordCache,
};
