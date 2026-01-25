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
  selectActivePetId,
  selectActiveViewingChatId,
  markChatAsRead
} from '../features/badge/badgeSlice';
import signalRService from '../services/signalr.service';
import { refreshBadgesForActivePet } from '../utils/badgeRefresh';

/**
 * Hook to manage badge notifications via SignalR
 */
export const useBadgeNotifications = (userId: number | null) => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    if (!userId) {
      return;
    }

    let isMounted = true;

    const initializeBadges = async () => {
      try {
        if (!isMounted) return;
        await refreshBadgesForActivePet(userId, true);
      } catch (error) {
        // Silent fail
      }
    };

    const timer = setTimeout(() => {
      initializeBadges();
    }, 100);

    const handleNewMessageBadge = (data: any) => {
      const matchId = data.matchId || data.MatchId;
      const fromPetId = data.fromPetId || data.FromPetId;
      const toPetId = data.toPetId || data.ToPetId;

      if (!matchId) {
        return;
      }

      const currentState = store.getState();
      const activePetId = selectActivePetId(currentState);

      if (activePetId && toPetId === activePetId) {
        const activeViewingChatId = selectActiveViewingChatId(currentState);
        
        if (activeViewingChatId === matchId) {
          return;
        }
        
        dispatch(addUnreadChat(matchId));
      } else if (!activePetId) {
        dispatch(addUnreadChat(matchId));
      }
    };

    const handleNewLikeBadge = (data: any) => {
      dispatch(incrementFavoriteBadge());
    };

    const handleMatchSuccess = (data: any) => {
      const matchId = data.matchId || data.MatchId || 0;
      const otherUserId = data.otherUserId || data.OtherUserId || 0;
      const otherUserName = data.otherUserName || data.OtherUserName || 'Someone';
      const petName = data.petName || data.PetName;
      const petPhotoUrl = data.petPhotoUrl || data.PetPhotoUrl;

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
      const chatExpertId = data.chatExpertId || data.ChatExpertId;

      if (!chatExpertId) {
        return;
      }

      dispatch(addUnreadExpertChat(chatExpertId));
    };

    const handleNewNotification = (data: any) => {
      dispatch(incrementNotificationBadge());
    };

    const handleMatchDeleted = (data: any) => {
      const matchId = data.matchId || data.MatchId;
      
      if (matchId) {
        dispatch(markChatAsRead(matchId));
      }
    };

    signalRService.on('NewMessageBadge', handleNewMessageBadge);
    signalRService.on('NewLikeBadge', handleNewLikeBadge);
    signalRService.on('MatchSuccess', handleMatchSuccess);
    signalRService.on('NewExpertMessageBadge', handleNewExpertMessageBadge);
    signalRService.on('NewNotification', handleNewNotification);
    signalRService.on('MatchDeleted', handleMatchDeleted);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      
      signalRService.off('NewMessageBadge', handleNewMessageBadge);
      signalRService.off('NewLikeBadge', handleNewLikeBadge);
      signalRService.off('MatchSuccess', handleMatchSuccess);
      signalRService.off('NewExpertMessageBadge', handleNewExpertMessageBadge);
      signalRService.off('NewNotification', handleNewNotification);
      signalRService.off('MatchDeleted', handleMatchDeleted);
    };
  }, [userId, dispatch]);
};
