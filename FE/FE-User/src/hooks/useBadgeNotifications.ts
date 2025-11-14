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
import { getPetsByUserId } from '../api/pet';

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
    const handleNewMessageBadge = async (data: any) => {
      const matchId = data.matchId || data.MatchId;
      const fromPetId = data.fromPetId || data.FromPetId;
      const toPetId = data.toPetId || data.ToPetId;
      
      if (!matchId) return;
      
      // Check if this message is for the user's active pet
      try {
        const userPets = await getPetsByUserId(userId);
        const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);
        
        if (activePet) {
          const activePetId = activePet.PetId || activePet.petId;
          
          // Only show badge if the message is for the active pet
          // The message is relevant if active pet matches either fromPetId or toPetId
          if (activePetId === fromPetId || activePetId === toPetId) {
            console.log(`📬 New message for active pet ${activePetId}, showing badge`);
            dispatch(addUnreadChat(matchId));
          } else {
            console.log(`🔕 Message for pet ${fromPetId}/${toPetId}, but active pet is ${activePetId} - ignoring`);
          }
        } else {
          // No active pet, show all notifications (fallback)
          console.log(`⚠️ No active pet found, showing all notifications`);
          dispatch(addUnreadChat(matchId));
        }
      } catch (error) {
        console.error('Error checking active pet for notification:', error);
        // On error, show notification (fallback)
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
      
      // Don't increment notification badge for matches
      // Notification badge is only for admin and expert notifications
      // dispatch(incrementNotificationBadge());
      
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

