/**
 * Event Redux Slice
 * Manages event state and async actions with optimistic updates for voting
 */

import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';
import {
  EventResponse,
  EventDetailResponse,
  LeaderboardResponse,
  SubmitEntryRequest,
  SubmissionResponse,
  EventState,
} from '../../types/event.types';
import { EventService } from './event.service';

// ============================================
// INITIAL STATE
// ============================================

const initialState: EventState = {
  events: [],
  currentEvent: null,
  leaderboard: [],
  loading: false,
  submitting: false,
  voting: false,
  error: null,
};

// ============================================
// ASYNC THUNKS
// ============================================

/**
 * Fetch active events list
 */
export const fetchActiveEvents = createAsyncThunk(
  'event/fetchActiveEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await EventService.getActiveEvents();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy danh sách sự kiện');
    }
  }
);

/**
 * Fetch event by ID with submissions
 */
export const fetchEventById = createAsyncThunk(
  'event/fetchEventById',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await EventService.getEventById(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy thông tin sự kiện');
    }
  }
);

/**
 * Submit entry to event
 */
export const submitEntry = createAsyncThunk(
  'event/submitEntry',
  async (params: { eventId: number; request: SubmitEntryRequest }, { rejectWithValue }) => {
    try {
      const response = await EventService.submitEntry(params.eventId, params.request);
      return { eventId: params.eventId, submission: response };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi đăng bài dự thi');
    }
  }
);

/**
 * Vote for a submission (with optimistic update)
 */
export const voteSubmission = createAsyncThunk(
  'event/voteSubmission',
  async (submissionId: number, { rejectWithValue }) => {
    try {
      await EventService.vote(submissionId);
      return submissionId;
    } catch (error: any) {
      return rejectWithValue({ submissionId, message: error.message || 'Lỗi khi vote' });
    }
  }
);

/**
 * Unvote a submission (with optimistic update)
 */
export const unvoteSubmission = createAsyncThunk(
  'event/unvoteSubmission',
  async (submissionId: number, { rejectWithValue }) => {
    try {
      await EventService.unvote(submissionId);
      return submissionId;
    } catch (error: any) {
      return rejectWithValue({ submissionId, message: error.message || 'Lỗi khi bỏ vote' });
    }
  }
);

/**
 * Fetch leaderboard for an event
 */
export const fetchLeaderboard = createAsyncThunk(
  'event/fetchLeaderboard',
  async (eventId: number, { rejectWithValue }) => {
    try {
      const response = await EventService.getLeaderboard(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Lỗi khi lấy bảng xếp hạng');
    }
  }
);


// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update submission vote state in submissions array
 */
const updateSubmissionVote = (
  submissions: SubmissionResponse[] | undefined,
  submissionId: number,
  hasVoted: boolean,
  voteCountDelta: number
): SubmissionResponse[] | undefined => {
  if (!submissions) return submissions;
  
  return submissions.map(sub => {
    if (sub.submissionId === submissionId) {
      return {
        ...sub,
        hasVoted,
        voteCount: Math.max(0, sub.voteCount + voteCountDelta),
      };
    }
    return sub;
  });
};

/**
 * Update submission vote state in leaderboard
 */
const updateLeaderboardVote = (
  leaderboard: LeaderboardResponse[],
  submissionId: number,
  hasVoted: boolean,
  voteCountDelta: number
): LeaderboardResponse[] => {
  return leaderboard.map(entry => {
    if (entry.submission.submissionId === submissionId) {
      return {
        ...entry,
        submission: {
          ...entry.submission,
          hasVoted,
          voteCount: Math.max(0, entry.submission.voteCount + voteCountDelta),
        },
      };
    }
    return entry;
  });
};

// ============================================
// SLICE
// ============================================

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    // Clear current event
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    
    // Clear leaderboard
    clearLeaderboard: (state) => {
      state.leaderboard = [];
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    
    // Reset entire state
    resetEventState: () => initialState,
    
    // Optimistic vote update
    optimisticVote: (state, action: PayloadAction<number>) => {
      const submissionId = action.payload;
      
      // Update in currentEvent submissions
      if (state.currentEvent?.submissions) {
        state.currentEvent.submissions = updateSubmissionVote(
          state.currentEvent.submissions,
          submissionId,
          true,
          1
        );
      }
      
      // Update in leaderboard
      state.leaderboard = updateLeaderboardVote(
        state.leaderboard,
        submissionId,
        true,
        1
      );
    },
    
    // Optimistic unvote update
    optimisticUnvote: (state, action: PayloadAction<number>) => {
      const submissionId = action.payload;
      
      // Update in currentEvent submissions
      if (state.currentEvent?.submissions) {
        state.currentEvent.submissions = updateSubmissionVote(
          state.currentEvent.submissions,
          submissionId,
          false,
          -1
        );
      }
      
      // Update in leaderboard
      state.leaderboard = updateLeaderboardVote(
        state.leaderboard,
        submissionId,
        false,
        -1
      );
    },
    
    // Rollback vote (on error)
    rollbackVote: (state, action: PayloadAction<number>) => {
      const submissionId = action.payload;
      
      // Rollback in currentEvent submissions
      if (state.currentEvent?.submissions) {
        state.currentEvent.submissions = updateSubmissionVote(
          state.currentEvent.submissions,
          submissionId,
          false,
          -1
        );
      }
      
      // Rollback in leaderboard
      state.leaderboard = updateLeaderboardVote(
        state.leaderboard,
        submissionId,
        false,
        -1
      );
    },
    
    // Rollback unvote (on error)
    rollbackUnvote: (state, action: PayloadAction<number>) => {
      const submissionId = action.payload;
      
      // Rollback in currentEvent submissions
      if (state.currentEvent?.submissions) {
        state.currentEvent.submissions = updateSubmissionVote(
          state.currentEvent.submissions,
          submissionId,
          true,
          1
        );
      }
      
      // Rollback in leaderboard
      state.leaderboard = updateLeaderboardVote(
        state.leaderboard,
        submissionId,
        true,
        1
      );
    },
  },
  
  extraReducers: (builder) => {
    // Fetch Active Events
    builder
      .addCase(fetchActiveEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload;
      })
      .addCase(fetchActiveEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Fetch Event by ID
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
    
    // Submit Entry
    builder
      .addCase(submitEntry.pending, (state) => {
        state.submitting = true;
        state.error = null;
      })
      .addCase(submitEntry.fulfilled, (state, action) => {
        state.submitting = false;
        
        // Add new submission to currentEvent
        if (state.currentEvent && state.currentEvent.eventId === action.payload.eventId) {
          const submissions = state.currentEvent.submissions || [];
          state.currentEvent.submissions = [action.payload.submission, ...submissions];
          state.currentEvent.submissionCount += 1;
        }
        
        // Update event in list
        const eventIndex = state.events.findIndex(e => e.eventId === action.payload.eventId);
        if (eventIndex !== -1) {
          state.events[eventIndex].submissionCount += 1;
        }
      })
      .addCase(submitEntry.rejected, (state, action) => {
        state.submitting = false;
        state.error = action.payload as string;
      });
    
    // Vote Submission
    builder
      .addCase(voteSubmission.pending, (state) => {
        state.voting = true;
      })
      .addCase(voteSubmission.fulfilled, (state) => {
        state.voting = false;
        // Optimistic update already applied
      })
      .addCase(voteSubmission.rejected, (state, action) => {
        state.voting = false;
        const payload = action.payload as { submissionId: number; message: string };
        state.error = payload.message;
        // Rollback handled by component
      });
    
    // Unvote Submission
    builder
      .addCase(unvoteSubmission.pending, (state) => {
        state.voting = true;
      })
      .addCase(unvoteSubmission.fulfilled, (state) => {
        state.voting = false;
        // Optimistic update already applied
      })
      .addCase(unvoteSubmission.rejected, (state, action) => {
        state.voting = false;
        const payload = action.payload as { submissionId: number; message: string };
        state.error = payload.message;
        // Rollback handled by component
      });
    
    // Fetch Leaderboard
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.loading = false;
        state.leaderboard = action.payload;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// ============================================
// ACTIONS
// ============================================

export const {
  clearCurrentEvent,
  clearLeaderboard,
  clearError,
  resetEventState,
  optimisticVote,
  optimisticUnvote,
  rollbackVote,
  rollbackUnvote,
} = eventSlice.actions;

// ============================================
// SELECTORS
// ============================================

// Basic selectors
export const selectEvents = (state: RootState) => state.event.events;
export const selectCurrentEvent = (state: RootState) => state.event.currentEvent;
export const selectLeaderboard = (state: RootState) => state.event.leaderboard;
export const selectEventLoading = (state: RootState) => state.event.loading;
export const selectEventSubmitting = (state: RootState) => state.event.submitting;
export const selectEventVoting = (state: RootState) => state.event.voting;
export const selectEventError = (state: RootState) => state.event.error;

// Filtered selectors (memoized)
export const selectActiveEvents = createSelector(
  [selectEvents],
  (events) => events.filter(e => e.status === 'active')
);

export const selectUpcomingEvents = createSelector(
  [selectEvents],
  (events) => events.filter(e => e.status === 'upcoming')
);

export const selectCompletedEvents = createSelector(
  [selectEvents],
  (events) => events.filter(e => e.status === 'completed')
);

// Select submissions from current event
export const selectCurrentEventSubmissions = createSelector(
  [selectCurrentEvent],
  (event) => event?.submissions || []
);

// Select winners from current event
export const selectCurrentEventWinners = createSelector(
  [selectCurrentEvent],
  (event) => event?.winners || []
);

// Check if user has submitted to current event
export const selectHasUserSubmitted = createSelector(
  [selectCurrentEventSubmissions],
  (submissions) => submissions.some(sub => sub.isOwner)
);

export default eventSlice.reducer;
