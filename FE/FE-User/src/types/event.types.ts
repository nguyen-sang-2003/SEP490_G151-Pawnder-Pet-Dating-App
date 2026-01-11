/**
 * Event Feature Types
 * Matching Backend DTOs from BE.DTO.EventDTO
 */

// ============================================
// ENUMS & UNION TYPES
// ============================================

/**
 * Event Status
 */
export type EventStatus =
  | 'upcoming'
  | 'active'
  | 'submission_closed'
  | 'voting_ended'
  | 'completed'
  | 'cancelled';

/**
 * Media Type
 */
export type MediaType = 'image' | 'video';

// ============================================
// RESPONSE DTOs
// ============================================

/**
 * Event Response từ API (danh sách sự kiện)
 */
export interface EventResponse {
  eventId: number;
  title: string;
  description?: string;
  coverImageUrl?: string;
  startTime: string;
  submissionDeadline: string;
  endTime: string;
  status: EventStatus;
  prizeDescription?: string;
  prizePoints: number;
  submissionCount: number;
  totalVotes: number;
  createdAt: string;
}

/**
 * Event Detail Response (bao gồm submissions và winners)
 */
export interface EventDetailResponse extends EventResponse {
  createdByName?: string;
  submissions?: SubmissionResponse[];
  winners?: SubmissionResponse[];
}

/**
 * Submission Response (bài dự thi)
 */
export interface SubmissionResponse {
  submissionId: number;
  eventId: number;

  // User info
  userId: number;
  userName?: string;
  userAvatar?: string;

  // Pet info
  petId: number;
  petName?: string;
  petPhotoUrl?: string;

  // Media
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  caption?: string;

  // Stats
  voteCount: number;
  rank?: number;
  isWinner: boolean;

  // User interaction
  hasVoted: boolean;
  isOwner: boolean;

  createdAt: string;
}

/**
 * Leaderboard Response (bảng xếp hạng)
 */
export interface LeaderboardResponse {
  rank: number;
  submission: SubmissionResponse;
}

// ============================================
// REQUEST DTOs
// ============================================

/**
 * Request để đăng bài dự thi
 */
export interface SubmitEntryRequest {
  eventId?: number;
  petId: number;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailUrl?: string;
  caption?: string;
}

// ============================================
// STATUS CONFIG
// ============================================

/**
 * Status colors and labels for UI display
 */
export const EVENT_STATUS_CONFIG: Record<
  EventStatus,
  {
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  upcoming: {
    label: 'Sắp diễn ra',
    color: '#007AFF',
    bgColor: '#E5F1FF',
  },
  active: {
    label: 'Đang diễn ra',
    color: '#34C759',
    bgColor: '#E8F8EC',
  },
  submission_closed: {
    label: 'Hết hạn nộp bài',
    color: '#FF9500',
    bgColor: '#FFF4E5',
  },
  voting_ended: {
    label: 'Hết hạn vote',
    color: '#8E8E93',
    bgColor: '#F2F2F7',
  },
  completed: {
    label: 'Đã kết thúc',
    color: '#5856D6',
    bgColor: '#EFEFFB',
  },
  cancelled: {
    label: 'Đã hủy',
    color: '#FF3B30',
    bgColor: '#FFE8E6',
  },
};

// ============================================
// STATE TYPES (for Redux)
// ============================================

export interface EventState {
  // Data
  events: EventResponse[];
  currentEvent: EventDetailResponse | null;
  leaderboard: LeaderboardResponse[];

  // Loading states
  loading: boolean;
  submitting: boolean;
  voting: boolean;

  // Error
  error: string | null;
}
