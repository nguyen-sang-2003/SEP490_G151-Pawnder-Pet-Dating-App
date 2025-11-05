import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../app/store';
import { 
  setBadgeCounts, 
  incrementChatBadge, 
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
      console.log('⚠️ [useBadgeNotifications] No userId, skipping setup');
      return;
    }

    console.log('🔔 [useBadgeNotifications] Setting up for userId:', userId);

    // Fetch initial badge counts
    const fetchBadgeCounts = async () => {
      try {
        console.log('📊 [useBadgeNotifications] Fetching initial badge counts...');
        const counts = await getBadgeCounts(userId);
        console.log('✅ [useBadgeNotifications] Initial counts:', counts);
        dispatch(setBadgeCounts(counts));
      } catch (error) {
        console.error('❌ [useBadgeNotifications] Error fetching badge counts:', error);
      }
    };

    fetchBadgeCounts();

    // Setup SignalR listeners for real-time badge updates
    const handleNewMessageBadge = (data: any) => {
      console.log('📬 [HOOK] New message badge received, incrementing chat badge:', data);
      dispatch(incrementChatBadge());
      console.log('✅ [HOOK] Chat badge incremented');
    };

    const handleNewLikeBadge = (data: any) => {
      console.log('💗 [HOOK] New like badge received, incrementing favorite badge:', data);
      dispatch(incrementFavoriteBadge());
      console.log('✅ [HOOK] Favorite badge incremented');
    };

    const handleMatchSuccess = (data: any) => {
      console.log('🎉 [HOOK] Match success received - RAW DATA:', JSON.stringify(data, null, 2));
      
      // Backend sends lowercase keys, not PascalCase!
      const matchId = data.matchId || data.MatchId || 0;
      const otherUserId = data.otherUserId || data.OtherUserId || 0;
      const otherUserName = data.otherUserName || data.OtherUserName || 'Someone';
      const petName = data.petName || data.PetName;
      const petPhotoUrl = data.petPhotoUrl || data.PetPhotoUrl;
      
      console.log('🔍 [HOOK] Parsed fields:', {
        matchId,
        otherUserId,
        otherUserName,
        petName,
        petPhotoUrl,
      });
      
      // Increment notification badge
      dispatch(incrementNotificationBadge());
      console.log('✅ [HOOK] Notification badge incremented');
      
      // Show match modal with pet info
      dispatch(showMatchModal({
        otherUserName,
        otherUserId,
        matchId,
        petName,
        petPhotoUrl,
      }));
      console.log('✅ [HOOK] Match modal shown - userName:', otherUserName, 'pet:', petName);
    };

    // Register event listeners
    console.log('📝 [useBadgeNotifications] Registering SignalR event listeners...');
    signalRService.on('NewMessageBadge', handleNewMessageBadge);
    signalRService.on('NewLikeBadge', handleNewLikeBadge);
    signalRService.on('MatchSuccess', handleMatchSuccess);
    console.log('✅ [useBadgeNotifications] Event listeners registered');

    // Cleanup
    return () => {
      console.log('🧹 [useBadgeNotifications] Cleaning up event listeners');
      signalRService.off('NewMessageBadge', handleNewMessageBadge);
      signalRService.off('NewLikeBadge', handleNewLikeBadge);
      signalRService.off('MatchSuccess', handleMatchSuccess);
    };
  }, [userId, dispatch]);
};

