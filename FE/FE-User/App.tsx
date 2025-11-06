import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store } from "./src/app/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { useBadgeNotifications } from "./src/hooks/useBadgeNotifications";
import { getUserId, getAuthToken, storeUserId } from "./src/api/auth";
import { getUserIdFromToken } from "./src/utils/jwtHelper";
import signalRService from "./src/services/signalr.service";
import MatchModal from "./src/components/MatchModal";
import { selectMatchModal, hideMatchModal } from "./src/features/badge/badgeSlice";
import { AppDispatch } from "./src/app/store";
import { navigate } from "./src/services/navigation.service";

/**
 * App Wrapper with Badge Notifications and Match Modal
 */
function AppWithBadges(): React.JSX.Element {
  const [userId, setUserId] = useState<number | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const matchModal = useSelector(selectMatchModal);

  useEffect(() => {
    const initializeUser = async () => {
      let storedUserId = await getUserId();
      
      if (!storedUserId) {
        const token = await getAuthToken();
        if (token) {
          const userIdFromToken = getUserIdFromToken(token);
          if (userIdFromToken) {
            await storeUserId(userIdFromToken);
            storedUserId = userIdFromToken;
          } else {
            console.error('Failed to extract userId from token');
          }
        }
      }
      
      if (storedUserId) {
        setUserId(storedUserId);
        try {
          await signalRService.connect(storedUserId);
        } catch (error) {
          console.error('SignalR connection failed:', error);
        }
      }
    };

    initializeUser();

    return () => {
      signalRService.disconnect();
    };
  }, []);

  // Initialize badge notifications
  useBadgeNotifications(userId);

  const handleView = () => {
    dispatch(hideMatchModal());
    navigate('Favorite');
  };

  const handleStartChat = () => {
    dispatch(hideMatchModal());
    navigate('ChatDetail', {
      matchId: matchModal.matchId,
      otherUserId: matchModal.otherUserId,
      userName: matchModal.otherUserName,
    });
  };

  const handleCloseModal = () => {
    dispatch(hideMatchModal());
  };

  return (
    <>
      <AppNavigator />
      <MatchModal
        visible={matchModal.visible}
        otherUserName={matchModal.otherUserName}
        otherUserId={matchModal.otherUserId}
        matchId={matchModal.matchId}
        petName={matchModal.petName}
        petPhotoUrl={matchModal.petPhotoUrl}
        onView={handleView}
        onStartChat={handleStartChat}
        onClose={handleCloseModal}
      />
    </>
  );
}

function App(): React.JSX.Element {
  return (
    <Provider store={store}>
      <AppWithBadges />
    </Provider>
  );
}

export default App;
