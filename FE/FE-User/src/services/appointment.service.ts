/**
 * Appointment Service
 * Handles all appointment-related API calls
 */

import { apiClient } from '../api/axiosClient';
import {
  AppointmentResponse,
  CreateAppointmentRequest,
  RespondAppointmentRequest,
  CounterOfferRequest,
  CancelAppointmentRequest,
  CheckInRequest,
  LocationResponse,
  CreateLocationRequest,
  ValidationResponse,
} from '../types/appointment.types';

const APPOINTMENT_BASE_URL = '/api/Appointment';

/**
 * Appointment Service API methods
 */
export const AppointmentService = {
  /**
   * Kiểm tra điều kiện tiên quyết trước khi tạo cuộc hẹn
   */
  validatePreconditions: async (
    matchId: number,
    inviterPetId: number,
    inviteePetId: number
  ): Promise<ValidationResponse> => {
    try {
      const response = await apiClient.get<ValidationResponse>(
        `${APPOINTMENT_BASE_URL}/validate-preconditions`,
        {
          params: { matchId, inviterPetId, inviteePetId },
        }
      );
      // Backend trả về { isValid, message } trực tiếp
      return {
        isValid: response.data.isValid,
        message: response.data.message || '',
      };
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi kiểm tra điều kiện'
      );
    }
  },

  /**
   * Tạo cuộc hẹn mới
   */
  createAppointment: async (
    request: CreateAppointmentRequest
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.post<{ data: AppointmentResponse }>(
        APPOINTMENT_BASE_URL,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi tạo cuộc hẹn'
      );
    }
  },

  /**
   * Lấy thông tin cuộc hẹn theo ID
   */
  getAppointmentById: async (
    appointmentId: number
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.get<AppointmentResponse>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi lấy thông tin cuộc hẹn'
      );
    }
  },

  /**
   * Lấy danh sách cuộc hẹn theo Match
   */
  getAppointmentsByMatch: async (
    matchId: number
  ): Promise<AppointmentResponse[]> => {
    try {
      const response = await apiClient.get<AppointmentResponse[]>(
        `${APPOINTMENT_BASE_URL}/by-match/${matchId}`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          'Lỗi khi lấy danh sách cuộc hẹn theo match'
      );
    }
  },

  /**
   * Lấy danh sách tất cả cuộc hẹn của user hiện tại
   */
  getMyAppointments: async (): Promise<AppointmentResponse[]> => {
    try {
      const response = await apiClient.get<AppointmentResponse[]>(
        `${APPOINTMENT_BASE_URL}/my-appointments`
      );
      return response.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message ||
          'Lỗi khi lấy danh sách cuộc hẹn của bạn'
      );
    }
  },

  /**
   * Phản hồi cuộc hẹn (Accept/Decline)
   */
  respondToAppointment: async (
    appointmentId: number,
    request: RespondAppointmentRequest
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.put<{ data: AppointmentResponse }>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/respond`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi phản hồi cuộc hẹn'
      );
    }
  },

  /**
   * Đề xuất lại cuộc hẹn (Counter-Offer)
   */
  counterOffer: async (
    appointmentId: number,
    request: CounterOfferRequest
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.put<{ data: AppointmentResponse }>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/counter-offer`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi đề xuất lại cuộc hẹn'
      );
    }
  },

  /**
   * Hủy cuộc hẹn
   */
  cancelAppointment: async (
    appointmentId: number,
    request: CancelAppointmentRequest
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.put<{ data: AppointmentResponse }>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/cancel`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi hủy cuộc hẹn'
      );
    }
  },

  /**
   * Check-in tại địa điểm hẹn (bằng GPS)
   */
  checkIn: async (
    appointmentId: number,
    request: CheckInRequest
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.post<{ data: AppointmentResponse }>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/check-in`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi check-in'
      );
    }
  },

  /**
   * Kết thúc cuộc hẹn (Complete)
   */
  completeAppointment: async (
    appointmentId: number
  ): Promise<AppointmentResponse> => {
    try {
      const response = await apiClient.put<{ data: AppointmentResponse }>(
        `${APPOINTMENT_BASE_URL}/${appointmentId}/complete`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi kết thúc cuộc hẹn'
      );
    }
  },

  /**
   * Lấy danh sách địa điểm Pet-Friendly gợi ý
   */
  getSuggestedLocations: async (
    latitude?: number,
    longitude?: number,
    city?: string
  ): Promise<LocationResponse[]> => {
    try {
      const params: any = {};
      if (latitude !== undefined) params.latitude = latitude;
      if (longitude !== undefined) params.longitude = longitude;
      if (city) params.city = city;

      const response = await apiClient.get<LocationResponse[]>(
        `${APPOINTMENT_BASE_URL}/locations`,
        { params }
      );
      // Backend trả về array trực tiếp
      return Array.isArray(response.data) ? response.data : [];
    } catch (error: any) {
      console.error('[AppointmentService] getSuggestedLocations error:', error);
      throw new Error(
        error?.response?.data?.message ||
          'Lỗi khi lấy danh sách địa điểm gợi ý'
      );
    }
  },

  /**
   * Tạo địa điểm mới
   */
  createLocation: async (
    request: CreateLocationRequest
  ): Promise<LocationResponse> => {
    try {
      const response = await apiClient.post<{ data: LocationResponse }>(
        `${APPOINTMENT_BASE_URL}/locations`,
        request
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error?.response?.data?.message || 'Lỗi khi tạo địa điểm'
      );
    }
  },
};

export default AppointmentService;
