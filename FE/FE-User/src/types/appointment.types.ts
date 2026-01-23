/**
 * Appointment Feature Types
 * Matching Backend DTOs from BE.DTO.AppointmentDTO
 */

// ============================================
// REQUEST DTOs
// ============================================

/**
 * Request để tạo cuộc hẹn mới
 */
export interface CreateAppointmentRequest {
  matchId: number;
  inviterPetId: number;
  inviteePetId: number;
  appointmentDateTime: string; // ISO 8601 format
  locationId?: number;
  customLocation?: CreateLocationRequest;
  activityType: 'walk' | 'cafe' | 'playdate';
}

/**
 * Request để phản hồi cuộc hẹn (Accept/Decline)
 */
export interface RespondAppointmentRequest {
  appointmentId: number;
  accept: boolean;
  declineReason?: string; // Required if accept = false
}

/**
 * Request để đề xuất lại (Counter-Offer)
 */
export interface CounterOfferRequest {
  appointmentId: number;
  newDateTime?: string; // ISO 8601 format
  newLocationId?: number;
  newCustomLocation?: CreateLocationRequest;
}

/**
 * Request để hủy cuộc hẹn
 */
export interface CancelAppointmentRequest {
  appointmentId: number;
  reason: string;
}

/**
 * Request để check-in bằng GPS
 */
export interface CheckInRequest {
  appointmentId: number;
  latitude: number;
  longitude: number;
}

/**
 * Request để tạo địa điểm mới
 */
export interface CreateLocationRequest {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  placeType?: string;
  googlePlaceId?: string;
}

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Response thông tin cuộc hẹn
 */
export interface AppointmentResponse {
  appointmentId: number;
  matchId: number;
  
  // Inviter info
  inviterPetId: number;
  inviterPetName?: string;
  inviterUserId: number;
  inviterUserName?: string;
  
  // Invitee info
  inviteePetId: number;
  inviteePetName?: string;
  inviteeUserId: number;
  inviteeUserName?: string;
  
  // Appointment details
  appointmentDateTime: string;
  location?: LocationResponse;
  activityType: string;
  status: AppointmentStatus;
  
  // Decision tracking
  currentDecisionUserId?: number;
  counterOfferCount: number;
  
  // Check-in status
  inviterCheckedIn: boolean;
  inviteeCheckedIn: boolean;
  inviterCheckInTime?: string;
  inviteeCheckInTime?: string;
  
  // Cancellation info
  cancelledBy?: number;
  cancelReason?: string;
  
  createdAt: string;
  updatedAt: string;
  
  // Conflict warning (computed, not stored in DB)
  hasConflict?: boolean;
}

/**
 * Response thông tin địa điểm
 */
export interface LocationResponse {
  locationId: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  district?: string;
  isPetFriendly: boolean;
  placeType?: string;
  googlePlaceId?: string;
}

/**
 * DTO cho card lời mời hiển thị trong chat
 */
export interface AppointmentCardDto {
  appointmentId: number;
  inviterPetName: string;
  inviteePetName: string;
  appointmentDateTime: string;
  locationName?: string;
  activityType: string;
  status: string;
  canRespond: boolean;
  canCounterOffer: boolean;
  canCheckIn: boolean;
}

/**
 * Validation response từ API
 */
export interface ValidationResponse {
  isValid: boolean;
  message: string;
}

// ============================================
// ENUMS & CONSTANTS
// ============================================

/**
 * Appointment Status
 */
export type AppointmentStatus = 
  | 'pending'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'on_going'
  | 'completed'
  | 'no_show'
  | 'expired';

/**
 * Activity Types
 */
export type ActivityType = 'walk' | 'cafe' | 'playdate';

/**
 * Activity type display names
 */
export const ACTIVITY_TYPES: Record<ActivityType, { label: string; icon: string; description: string }> = {
  walk: {
    label: 'Đi dạo',
    icon: '🚶',
    description: 'Đi dạo cùng nhau tại công viên hoặc khu vực pet-friendly'
  },
  cafe: {
    label: 'Cafe thú cưng',
    icon: '☕',
    description: 'Thư giãn tại quán cafe dành cho thú cưng'
  },
  playdate: {
    label: 'Chơi cùng nhau',
    icon: '🎾',
    description: 'Cho thú cưng chơi và giao lưu với nhau'
  }
};

/**
 * Status colors and labels
 */
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatus, { 
  label: string; 
  color: string;
  bgColor: string;
  icon: string;
}> = {
  pending: {
    label: 'Chờ phản hồi',
    color: '#FF9500',
    bgColor: '#FFF4E5',
    icon: '⏳'
  },
  confirmed: {
    label: 'Đã xác nhận',
    color: '#34C759',
    bgColor: '#E8F8EC',
    icon: '✅'
  },
  rejected: {
    label: 'Đã từ chối',
    color: '#FF3B30',
    bgColor: '#FFE8E6',
    icon: '❌'
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#8E8E93',
    bgColor: '#F2F2F7',
    icon: '🚫'
  },
  on_going: {
    label: 'Đang diễn ra',
    color: '#007AFF',
    bgColor: '#E5F1FF',
    icon: '🎉'
  },
  completed: {
    label: 'Hoàn thành',
    color: '#5856D6',
    bgColor: '#EFEFFB',
    icon: '🎊'
  },
  no_show: {
    label: 'Không đến',
    color: '#FF9500',
    bgColor: '#FFF4E5',
    icon: '⚠️'
  },
  expired: {
    label: 'Đã hết hạn',
    color: '#8E8E93',
    bgColor: '#F2F2F7',
    icon: '⏰'
  }
};

/**
 * Business rules constants
 */
export const APPOINTMENT_RULES = {
  MIN_MESSAGES_REQUIRED: 10,
  MIN_HOURS_ADVANCE: 2,
  MAX_COUNTER_OFFERS: 3,
  CHECK_IN_RADIUS_METERS: 100,
  CHECK_IN_BEFORE_MINUTES: 30,  // Có thể check-in trước giờ hẹn 30 phút
  CHECK_IN_AFTER_MINUTES: 90,   // Có thể check-in sau giờ hẹn 90 phút
  AUTO_NO_SHOW_MINUTES: 90,     // Tự động NO_SHOW sau 90 phút nếu thiếu người check-in
  AUTO_COMPLETE_MINUTES: 90,    // Tự động COMPLETED sau 90 phút nếu đang ON_GOING
};

// ============================================
// STATE TYPES (for Redux)
// ============================================

export interface AppointmentState {
  appointments: AppointmentResponse[];
  currentAppointment: AppointmentResponse | null;
  locations: LocationResponse[];
  loading: boolean;
  error: string | null;
  
  // Action states
  creating: boolean;
  responding: boolean;
  cancelling: boolean;
  checkingIn: boolean;
}

export interface AppointmentFilters {
  status?: AppointmentStatus;
  petId?: number;
  dateFrom?: string;
  dateTo?: string;
}
