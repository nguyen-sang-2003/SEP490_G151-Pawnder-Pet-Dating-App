import { getBadgeCounts } from '../features/match/api/matchApi';
import { getPetsByUserId } from '../features/pet/api/petApi';
import { getUnreadNotificationCount } from '../features/notification/api/notificationApi';
import { store } from '../app/store';
import { setBadgeCounts, setActivePetId } from '../features/badge/badgeSlice';

let lastRefreshedPetId: number | null = null;
let refreshTimer: NodeJS.Timeout | null = null;
let ongoingRefresh: Promise<void> | null = null;
let lastRefreshTime = 0;
let isInitialized = false;

const MIN_REFRESH_INTERVAL = 3000;
const DEBOUNCE_DELAY = 500;

// Reset initialization flag (call on logout)
export const resetBadgeInitialization = () => {
  isInitialized = false;
  lastRefreshedPetId = null;
};

const _refreshBadgesForActivePetImpl = async (
  userId: number,
  skipRateLimit: boolean = false
): Promise<void> => {
  try {
    const now = Date.now();

    if (!skipRateLimit && now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
      return;
    }

    lastRefreshTime = now;

    const currentState = store.getState();
    const currentUnreadChats = currentState.badge.unreadChats || [];

    const userPets = await getPetsByUserId(userId);
    const activePet = userPets.find(
      (p) => p.IsActive === true || p.isActive === true
    );

    const notificationCount = await getUnreadNotificationCount(userId);

    if (activePet) {
      const activePetId = activePet.PetId || activePet.petId;
      if (!activePetId) {
        return;
      }

      const isPetSwitch =
        lastRefreshedPetId !== null && lastRefreshedPetId !== activePetId;
      lastRefreshedPetId = activePetId;

      store.dispatch(setActivePetId(activePetId));

      const counts = await getBadgeCounts(userId, activePetId);
      const apiUnreadChats = counts.unreadChats || [];

      let finalUnreadChats: number[];

      if (!isInitialized || isPetSwitch) {
        // First load or pet switch: use API data
        finalUnreadChats = apiUnreadChats;
        isInitialized = true;
      } else {
        // Subsequent refreshes: keep local state (managed by SignalR)
        finalUnreadChats = currentUnreadChats;
      }

      store.dispatch(
        setBadgeCounts({
          ...counts,
          unreadChats: finalUnreadChats,
          notificationBadge: notificationCount,
        })
      );
    } else {
      lastRefreshedPetId = null;
      store.dispatch(setActivePetId(null));

      const counts = await getBadgeCounts(userId);
      const apiUnreadChats = counts.unreadChats || [];

      let finalUnreadChats: number[];

      if (!isInitialized) {
        finalUnreadChats = apiUnreadChats;
        isInitialized = true;
      } else {
        finalUnreadChats = currentUnreadChats;
      }

      store.dispatch(
        setBadgeCounts({
          ...counts,
          unreadChats: finalUnreadChats,
          notificationBadge: notificationCount,
        })
      );
    }
  } catch (error) {
    throw error;
  }
};

export const refreshBadgesForActivePet = async (
  userId: number,
  immediate: boolean = false
): Promise<void> => {
  if (ongoingRefresh) {
    return ongoingRefresh;
  }

  if (immediate) {
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

  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  return new Promise((resolve, reject) => {
    refreshTimer = setTimeout(async () => {
      try {
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
