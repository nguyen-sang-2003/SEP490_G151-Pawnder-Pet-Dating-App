import { getBadgeCounts } from '../features/match/api/matchApi';
import { getPetsByUserId } from '../features/pet/api/petApi';
import { getUnreadNotificationCount } from '../features/notification/api/notificationApi';
import { store } from '../app/store';
import { setBadgeCounts, setActivePetId } from '../features/badge/badgeSlice';

// Track the last pet ID we fetched badges for
let lastRefreshedPetId: number | null = null;

// Debounce & rate limiting to prevent excessive API calls
let refreshTimer: NodeJS.Timeout | null = null;
let ongoingRefresh: Promise<void> | null = null;
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 3000; // 3 seconds minimum between refreshes
const DEBOUNCE_DELAY = 500; // 500ms debounce

/**
 * Internal implementation of badge refresh
 */
const _refreshBadgesForActivePetImpl = async (userId: number, skipRateLimit: boolean = false): Promise<void> => {
  try {
    const now = Date.now();
    
    // Rate limiting: Skip if called too frequently (unless pet switched or skipRateLimit)
    if (!skipRateLimit && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      console.log(`⏭️ Skipping badge refresh (rate limited, ${MIN_REFRESH_INTERVAL - (now - lastRefreshTime)}ms remaining)`);
      return;
    }
    
    lastRefreshTime = now;
    console.log('🔄 Refreshing badges for active pet...');

    // Get current unread chats from Redux store (locally marked as read)
    const currentState = store.getState();
    const currentUnreadChats = currentState.badge.unreadChats || [];

    // Get user's active pet
    const userPets = await getPetsByUserId(userId);
    const activePet = userPets.find(p => p.IsActive === true || p.isActive === true);

    // Fetch notification badge count (independent of pet)
    const notificationCount = await getUnreadNotificationCount(userId);

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

      // ✅ Update Redux with active pet ID
      store.dispatch(setActivePetId(activePetId));

      // Fetch badge counts filtered by active pet from server
      const counts = await getBadgeCounts(userId, activePetId);

      const apiUnreadChats = counts.unreadChats || [];
      let mergedUnreadChats: number[];

      if (isPetSwitch) {
        // Pet switched: OVERWRITE completely with new pet's badges
        mergedUnreadChats = apiUnreadChats;
      } else {
        // Same pet: PRESERVE local read state
        // The server returns matchIds with unread messages based on "last message from other user"
        // But the user may have already opened and read those messages locally (Redux markChatAsRead)
        
        // IMPORTANT: Local state is the source of truth for "read" status
        // - If user read a chat locally, it won't be in currentUnreadChats
        // - API might still say it's unread (server doesn't know user read it)
        // - We should NOT restore chats that user marked as read
        
        // Strategy: KEEP local state, DON'T add from API
        // New messages will be added via SignalR (NewMessageBadge event)
        mergedUnreadChats = [...currentUnreadChats];
        
        console.log('📊 [Badge Merge] Preserving local read state:', {
          apiSays: apiUnreadChats,
          localSays: currentUnreadChats,
          result: mergedUnreadChats
        });
      }

      // Update Redux store with merged data (including notification badge)
      store.dispatch(setBadgeCounts({
        ...counts,
        unreadChats: mergedUnreadChats,
        notificationBadge: notificationCount
      }));

      console.log('✅ Badges refreshed:', {
        isPetSwitch,
        fromAPI: apiUnreadChats.length,
        currentLocal: currentUnreadChats.length,
        final: mergedUnreadChats.length,
        notifications: notificationCount
      });
    } else {
      console.log('⚠️ No active pet found, fetching all badges...');

      // No active pet
      lastRefreshedPetId = null;

      // ✅ Clear active pet ID in Redux
      store.dispatch(setActivePetId(null));

      // Fetch all badges and overwrite (no merging when no active pet)
      const counts = await getBadgeCounts(userId);

      store.dispatch(setBadgeCounts({
        ...counts,
        notificationBadge: notificationCount
      }));
    }
  } catch (error) {
    console.error('❌ Badge refresh error:', error);
    throw error;
  }
};

/**
 * Refresh badge counts for the user's active pet
 * With debouncing and request deduplication
 */
export const refreshBadgesForActivePet = async (userId: number, immediate: boolean = false): Promise<void> => {
  // Request deduplication: If refresh is already in progress, return existing promise
  if (ongoingRefresh) {
    console.log('⏳ Badge refresh already in progress, waiting...');
    return ongoingRefresh;
  }

  // ✅ Immediate mode: Skip debounce for initial load
  if (immediate) {
    console.log('⚡ Immediate badge refresh (skipping debounce)');
    try {
      ongoingRefresh = _refreshBadgesForActivePetImpl(userId, true);
      await ongoingRefresh;
      ongoingRefresh = null;
    } catch (error) {
      ongoingRefresh = null;
      throw error;
    }
    return;
  }

  // Debouncing: Clear existing timer and set new one
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  return new Promise((resolve, reject) => {
    refreshTimer = setTimeout(async () => {
      try {
        // Mark refresh as ongoing
        ongoingRefresh = _refreshBadgesForActivePetImpl(userId);
        await ongoingRefresh;
        ongoingRefresh = null;
        resolve();
      } catch (error) {
        ongoingRefresh = null;
        reject(error);
      }
    }, DEBOUNCE_DELAY);
  });
};

