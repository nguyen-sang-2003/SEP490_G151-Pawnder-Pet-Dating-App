/**
 * Event Service
 * Handles all event-related API calls
 */

import { apiClient } from '../../api/axiosClient';
import {
  EventResponse,
  EventDetailResponse,
  SubmissionResponse,
  LeaderboardResponse,
  SubmitEntryRequest,
} from '../../types/event.types';

const EVENT_BASE_URL = '/api/event';

interface UploadMediaResponse {
  mediaUrl: string;
  mediaType: 'image' | 'video';
  publicId: string;
}

/**
 * Event Service API methods
 */
export const EventService = {
  /**
   * Lấy danh sách sự kiện đang hoạt động
   */
  getActiveEvents: async (): Promise<EventResponse[]> => {
    try {
      const response = await apiClient.get<EventResponse[]>(EVENT_BASE_URL);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi lấy danh sách sự kiện'
      );
    }
  },

  /**
   * Lấy chi tiết sự kiện theo ID
   */
  getEventById: async (eventId: number): Promise<EventDetailResponse> => {
    try {
      const response = await apiClient.get<EventDetailResponse>(
        `${EVENT_BASE_URL}/${eventId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi lấy thông tin sự kiện'
      );
    }
  },

  /**
   * Upload media (ảnh/video) cho bài dự thi
   */
  uploadMedia: async (
    uri: string,
    fileName?: string,
    mimeType?: string
  ): Promise<UploadMediaResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: mimeType || 'image/jpeg',
        name: fileName || `event_media_${Date.now()}.jpg`,
      } as any);

      const response = await apiClient.post<UploadMediaResponse>(
        `${EVENT_BASE_URL}/upload-media`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          timeout: 30000, // 30s timeout (match với backend)
        }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi upload ảnh/video'
      );
    }
  },

  /**
   * Đăng bài dự thi
   */
  submitEntry: async (
    eventId: number,
    request: SubmitEntryRequest
  ): Promise<SubmissionResponse> => {
    try {
      const response = await apiClient.post<{ data: SubmissionResponse }>(
        `${EVENT_BASE_URL}/${eventId}/submit`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi đăng bài dự thi'
      );
    }
  },

  /**
   * Vote cho bài dự thi
   */
  vote: async (submissionId: number): Promise<void> => {
    try {
      await apiClient.post(`${EVENT_BASE_URL}/submission/${submissionId}/vote`);
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Lỗi khi vote');
    }
  },

  /**
   * Bỏ vote
   */
  unvote: async (submissionId: number): Promise<void> => {
    try {
      await apiClient.delete(
        `${EVENT_BASE_URL}/submission/${submissionId}/vote`
      );
    } catch (error: any) {
      throw new Error(error?.response?.data?.message || 'Lỗi khi bỏ vote');
    }
  },

  /**
   * Lấy bảng xếp hạng
   */
  getLeaderboard: async (eventId: number): Promise<LeaderboardResponse[]> => {
    try {
      const response = await apiClient.get<LeaderboardResponse[]>(
        `${EVENT_BASE_URL}/${eventId}/leaderboard`
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi lấy bảng xếp hạng'
      );
    }
  },
};

export default EventService;
