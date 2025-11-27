import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch, store } from '../app/store';
import {
  setBadgeCounts,
  addUnreadChat,
  addUnreadExpertChat,
  incrementFavoriteBadge,
  incrementNotificationBadge,
  showMatchModal,
  selectActivePetId
} from '../features/badge/badgeSlice';
import signalRService from '../services/signalr.service';
import { refreshBadgesForActivePet } from '../utils/badgeRefresh';

/**
 * Custom hook to manage badge notifications
 * - Fetches initial badge counts
 * - Listens to real-time badge updates via SignalR
 */
export const useBadgeNotifications = (userId: number | null) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!userId) {
      return;
    }

    // Flag to prevent state updates after unmount
    let isMounted = true;

    // ✅ Fetch initial badge counts WITH active pet filtering
    const initializeBadges = async () => {
      try {
        if (!isMounted) return;
        await refreshBadgesForActivePet(userId);
        if (isMounted) {
          console.log('✅ Initial badges loaded for active pet');
        }
      } catch (error) {
        if (isMounted) {
          console.error('❌ Failed to initialize badges:', error);
        }
      }
    };

    initializeBadges();

    // Setup SignalR listeners for real-time badge updates
    const handleNewMessageBadge = (data: any) => {
      console.log('🔔 [NewMessageBadge] Received:', data);
      const matchId = data.matchId || data.MatchId;
      const fromPetId = data.fromPetId || data.FromPetId;
      const toPetId = data.toPetId || data.ToPetId;

      if (!matchId) {
        console.log('❌ [NewMessageBadge] No matchId, ignoring');
        return;
      }

      // ✅ FIX STALE CLOSURE: Read activePetId from store EACH TIME
      const currentState = store.getState();
      const activePetId = selectActivePetId(currentState);

      console.log(`🐾 [NewMessageBadge] Active pet: ${activePetId}, from: ${fromPetId}, to: ${toPetId}`);

      // ONLY show badge if the RECIPIENT is the active pet
      if (activePetId && toPetId === activePetId) {
        console.log(`📬 [NewMessageBadge] Message TO active pet ${activePetId}, showing badge`);
        dispatch(addUnreadChat(matchId));
      } else if (activePetId && fromPetId === activePetId) {
        console.log(`📤 [NewMessageBadge] Message FROM active pet ${activePetId}, no badge (user sent it)`);
      } else if (!activePetId) {
        // No active pet set, show notification (fallback)
        console.log(`⚠️ [NewMessageBadge] No active pet set, showing notification`);
        dispatch(addUnreadChat(matchId));
      } else {
        console.log(`🔕 [NewMessageBadge] Message for different pet (from: ${fromPetId}, to: ${toPetId}), active: ${activePetId} - ignoring`);
      }
    };

    const handleNewLikeBadge = (data: any) => {
      dispatch(incrementFavoriteBadge());
    };

    const handleMatchSuccess = (data: any) => {
      console.log('🎉 [MatchSuccess] Received:', data);
      const matchId = data.matchId || data.MatchId || 0;
      const otherUserId = data.otherUserId || data.OtherUserId || 0;
      const otherUserName = data.otherUserName || data.OtherUserName || 'Someone';
      const petName = data.petName || data.PetName;
      const petPhotoUrl = data.petPhotoUrl || data.PetPhotoUrl;

      // Increment favorite badge when match happens
      console.log('📬 [MatchSuccess] Incrementing favorite badge for new match');
      dispatch(incrementFavoriteBadge());

      dispatch(showMatchModal({
        otherUserName,
        otherUserId,
        matchId,
        petName,
        petPhotoUrl,
      }));
    };

    const handleNewExpertMessageBadge = (data: any) => {
      console.log('🔔 [NewExpertMessageBadge] Received:', data);
      const chatExpertId = data.chatExpertId || data.ChatExpertId;

      if (!chatExpertId) {
        console.log('❌ [NewExpertMessageBadge] No chatExpertId, ignoring');
        return;
      }

      console.log(`📬 [NewExpertMessageBadge] New message from expert in chat ${chatExpertId}`);
      dispatch(addUnreadExpertChat(chatExpertId));
    };

    signalRService.on('NewMessageBadge', handleNewMessageBadge);
    signalRService.on('NewLikeBadge', handleNewLikeBadge);
    signalRService.on('MatchSuccess', handleMatchSuccess);
    signalRService.on('NewExpertMessageBadge', handleNewExpertMessageBadge);

    return () => {
      // Set unmount flag to prevent state updates
      isMounted = false;
      
      // Clean up SignalR listeners
      signalRService.off('NewMessageBadge', handleNewMessageBadge);
      signalRService.off('NewLikeBadge', handleNewLikeBadge);
      signalRService.off('MatchSuccess', handleMatchSuccess);
      signalRService.off('NewExpertMessageBadge', handleNewExpertMessageBadge);
    };
  }, [userId, dispatch]);
};

