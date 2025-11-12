import { getBadgeCounts } from '../api/match';
import { getPetsByUserId } from '../api/pet';
import { store } from '../app/store';
import { setBadgeCounts } from '../features/badge/badgeSlice';

// Track the last pet ID we fetched badges for
let lastRefreshedPetId: number | null = null;

/**
 * Refresh badge counts for the user's active pet
 * Call this when switching pets to update badges
 */
export const refreshBadgesForActivePet = async (userId: number): Promise<void> => {
  try {
    console.log('🔄 Refreshing badges for active pet...');
    
    // Get current unread chats from Redux store (locally marked as read)
    const currentState = store.getState();
    const currentUnreadChats = currentState.badge.unreadChats || [];
    
    // Get user's active pet
    const userPets = await getPetsByUserId(userId);
    const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);
    
    if (activePet) {
      const activePetId = activePet.PetId || activePet.petId;
      if (!activePetId) {
        console.log('⚠️ Active pet has no ID');
        return;
      }
      
      const isPetSwitch = lastRefreshedPetId !== null && lastRefreshedPetId !== activePetId;
      
      console.log(`🐾 Active pet: ${activePetId}, fetching badges...`);
      if (isPetSwitch) {
        console.log(`🔄 Pet switched from ${lastRefreshedPetId} to ${activePetId} - clearing old badges`);
      }
      
      // Update last refreshed pet ID
      lastRefreshedPetId = activePetId;
      
      // Fetch badge counts filtered by active pet from server
      const counts = await getBadgeCounts(userId, activePetId);
      
      const apiUnreadChats = counts.unreadChats || [];
      let mergedUnreadChats: number[];
      
      if (isPetSwitch) {
        // Pet switched: OVERWRITE completely with new pet's badges
        mergedUnreadChats = apiUnreadChats;
      } else {
        // Same pet: Merge with local state
        // The server returns matchIds with unread messages based on "last message from other user"
        // But the user may have already opened and read those messages locally (Redux markChatAsRead)
        // Strategy: Keep current local state + add NEW unread chats from API
        // DON'T restore chats that user has already marked as read locally
        
        // Find new unread chats from API that are not in current local list
        const newUnreadChats = apiUnreadChats.filter(
          (matchId: number) => !currentUnreadChats.includes(matchId)
        );
        
        // Merge: Keep current local unread chats + add new ones from API
        mergedUnreadChats = [...currentUnreadChats, ...newUnreadChats];
      }
      
      // Update Redux store with merged data
      store.dispatch(setBadgeCounts({
        ...counts,
        unreadChats: mergedUnreadChats
      }));
      
      console.log('✅ Badges refreshed:', {
        isPetSwitch,
        fromAPI: apiUnreadChats.length,
        currentLocal: currentUnreadChats.length,
        final: mergedUnreadChats.length
      });
    } else {
      console.log('⚠️ No active pet found, fetching all badges...');
      
      // No active pet
      lastRefreshedPetId = null;
      
      // Fetch all badges and overwrite (no merging when no active pet)
      const counts = await getBadgeCounts(userId);
      
      store.dispatch(setBadgeCounts(counts));
    }
  } catch (error) {
    console.error('❌ Error refreshing badges:', error);
  }
};

