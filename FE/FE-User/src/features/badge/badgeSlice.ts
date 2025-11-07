import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../app/store';

interface MatchModalData {
  visible: boolean;
  otherUserName: string;
  otherUserId: number;
  matchId: number;
  petName?: string;
  petPhotoUrl?: string;
}

interface BadgeState {
  unreadChats: number[]; // Array of matchIds with unread messages
  favoriteBadge: number;
  notificationBadge: number;
  matchModal: MatchModalData;
}

const initialState: BadgeState = {
  unreadChats: [],
  favoriteBadge: 0,
  notificationBadge: 0,
  matchModal: {
    visible: false,
    otherUserName: '',
    otherUserId: 0,
    matchId: 0,
    petName: undefined,
    petPhotoUrl: undefined,
  },
};

const badgeSlice = createSlice({
  name: 'badge',
  initialState,
  reducers: {
    setBadgeCounts: (state, action: PayloadAction<{ unreadChats?: number[]; favoriteBadge: number; notificationBadge?: number }>) => {
      if (action.payload.unreadChats !== undefined) {
        state.unreadChats = action.payload.unreadChats;
      }
      state.favoriteBadge = action.payload.favoriteBadge;
      if (action.payload.notificationBadge !== undefined) {
        state.notificationBadge = action.payload.notificationBadge;
      }
    },
    addUnreadChat: (state, action: PayloadAction<number>) => {
      const matchId = action.payload;
      if (!state.unreadChats.includes(matchId)) {
        state.unreadChats.push(matchId);
      }
    },
    markChatAsRead: (state, action: PayloadAction<number>) => {
      const matchId = action.payload;
      state.unreadChats = state.unreadChats.filter(id => id !== matchId);
    },
    resetAllUnreadChats: (state) => {
      state.unreadChats = [];
    },
    incrementFavoriteBadge: (state) => {
      state.favoriteBadge += 1;
    },
    decrementFavoriteBadge: (state) => {
      if (state.favoriteBadge > 0) {
        state.favoriteBadge -= 1;
      }
    },
    resetFavoriteBadge: (state) => {
      state.favoriteBadge = 0;
    },
    incrementNotificationBadge: (state) => {
      state.notificationBadge += 1;
    },
    decrementNotificationBadge: (state) => {
      if (state.notificationBadge > 0) {
        state.notificationBadge -= 1;
      }
    },
    resetNotificationBadge: (state) => {
      state.notificationBadge = 0;
    },
    resetAllBadges: (state) => {
      state.unreadChats = [];
      state.favoriteBadge = 0;
      state.notificationBadge = 0;
    },
    showMatchModal: (state, action: PayloadAction<{ otherUserName: string; otherUserId: number; matchId: number; petName?: string; petPhotoUrl?: string }>) => {
      state.matchModal = {
        visible: true,
        otherUserName: action.payload.otherUserName,
        otherUserId: action.payload.otherUserId,
        matchId: action.payload.matchId,
        petName: action.payload.petName,
        petPhotoUrl: action.payload.petPhotoUrl,
      };
    },
    hideMatchModal: (state) => {
      state.matchModal = {
        visible: false,
        otherUserName: '',
        otherUserId: 0,
        matchId: 0,
        petName: undefined,
        petPhotoUrl: undefined,
      };
    },
  },
});

export const {
  setBadgeCounts,
  addUnreadChat,
  markChatAsRead,
  resetAllUnreadChats,
  incrementFavoriteBadge,
  decrementFavoriteBadge,
  resetFavoriteBadge,
  incrementNotificationBadge,
  decrementNotificationBadge,
  resetNotificationBadge,
  resetAllBadges,
  showMatchModal,
  hideMatchModal,
} = badgeSlice.actions;

// Selectors
export const selectUnreadChats = (state: RootState) => state.badge.unreadChats;
export const selectChatBadge = (state: RootState) => state.badge.unreadChats.length; // Badge = count of unread chats
export const selectFavoriteBadge = (state: RootState) => state.badge.favoriteBadge;
export const selectNotificationBadge = (state: RootState) => state.badge.notificationBadge;
export const selectMatchModal = (state: RootState) => state.badge.matchModal;

export default badgeSlice.reducer;

