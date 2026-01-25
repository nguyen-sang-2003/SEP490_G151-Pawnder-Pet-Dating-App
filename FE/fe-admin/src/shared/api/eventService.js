import apiClient from './apiClient';

/**
 * Event Service - API calls for event management (Admin)
 * Requirements: 7.1, 8.4, 9.5, 10.3, 11.1
 */

// ============ Event CRUD ============

/**
 * Get all events (for admin - includes all statuses)
 * @param {Object} params - Query parameters (status filter, search, etc.)
 */
export const getAllEvents = async (params) => {
  return apiClient.get('/api/event/all', { params });
};

/**
 * Get event by ID with submissions
 * @param {number} eventId
 */
export const getEventById = async (eventId) => {
  return apiClient.get(`/api/event/${eventId}`);
};

/**
 * Create new event (Admin only)
 * @param {Object} data - CreateEventRequest
 * @param {string} data.Title - Event title (required)
 * @param {string} data.Description - Event description
 * @param {string} data.CoverImageUrl - Cover image URL
 * @param {string} data.StartTime - Start time (required)
 * @param {string} data.SubmissionDeadline - Submission deadline (required)
 * @param {string} data.EndTime - End time (required)
 * @param {string} data.PrizeDescription - Prize description
 * @param {number} data.PrizePoints - Prize points
 */
export const createEvent = async (data) => {
  return apiClient.post('/api/event', data);
};

/**
 * Update event (Admin only)
 * @param {number} eventId
 * @param {Object} data - UpdateEventRequest
 */
export const updateEvent = async (eventId, data) => {
  return apiClient.put(`/api/event/${eventId}`, data);
};

/**
 * Cancel event (Admin only)
 * @param {number} eventId
 * @param {string} reason - Optional cancellation reason
 */
export const cancelEvent = async (eventId, reason) => {
  return apiClient.put(`/api/event/${eventId}/cancel`, { Reason: reason });
};

/**
 * Upload cover image for event (Admin only)
 * @param {File} file - Image file to upload
 * @returns {Promise<{coverImageUrl: string, publicId: string}>}
 */
export const uploadCoverImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  return apiClient.post('/api/event/upload-cover', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 60000, // 60s for upload
  });
};

// ============ Leaderboard ============

/**
 * Get event leaderboard (Top 10)
 * @param {number} eventId
 */
export const getLeaderboard = async (eventId) => {
  return apiClient.get(`/api/event/${eventId}/leaderboard`);
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  cancelEvent,
  uploadCoverImage,
  getLeaderboard,
};
