import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { 
  setBadgeCounts, 
  addUnreadChat,
  incrementFavoriteBadge,
  incrementNotificationBadge,
  showMatchModal
} from '../features/badge/badgeSlice';
import signalRService from '../services/signalr.service';
import { getBadgeCounts } from '../api/match';

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

    // Fetch initial badge counts
    const fetchBadgeCounts = async () => {
      try {
        const counts = await getBadgeCounts(userId);
        dispatch(setBadgeCounts(counts));
      } catch (error) {
        console.error('Error fetching badge counts:', error);
      }
    };

    fetchBadgeCounts();

    // Setup SignalR listeners for real-time badge updates
    const handleNewMessageBadge = (data: any) => {
      const matchId = data.matchId || data.MatchId;
      if (matchId) {
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
      
      dispatch(incrementNotificationBadge());
      dispatch(showMatchModal({
        otherUserName,
        otherUserId,
        matchId,
        petName,
        petPhotoUrl,
      }));
    };

    signalRService.on('NewMessageBadge', handleNewMessageBadge);
    signalRService.on('NewLikeBadge', handleNewLikeBadge);
    signalRService.on('MatchSuccess', handleMatchSuccess);

    return () => {
      signalRService.off('NewMessageBadge', handleNewMessageBadge);
      signalRService.off('NewLikeBadge', handleNewLikeBadge);
      signalRService.off('MatchSuccess', handleMatchSuccess);
    };
  }, [userId, dispatch]);
};

