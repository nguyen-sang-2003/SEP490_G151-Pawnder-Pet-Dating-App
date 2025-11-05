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
    // Get userId from storage or JWT token
    const initializeUser = async () => {
      let storedUserId = await getUserId();
      
      // If no userId in storage, try to get from JWT token
      if (!storedUserId) {
        console.log('⚠️ [App] No userId in storage, trying to get from token...');
        const token = await getAuthToken();
        if (token) {
          const userIdFromToken = getUserIdFromToken(token);
          if (userIdFromToken) {
            console.log('✅ [App] UserId extracted from token:', userIdFromToken);
            await storeUserId(userIdFromToken);
            storedUserId = userIdFromToken;
          } else {
            console.error('❌ [App] Failed to extract userId from token');
          }
        }
      }
      
      if (storedUserId) {
        console.log('📱 [App] User ID found:', storedUserId);
        setUserId(storedUserId);
        
        // Connect to SignalR
        try {
          await signalRService.connect(storedUserId);
          console.log('✅ [App] SignalR connected');
        } catch (error) {
          console.error('❌ [App] SignalR connection failed:', error);
        }
      } else {
        console.log('⚠️ [App] No userId available, badge notifications disabled');
      }
    };

    initializeUser();

    return () => {
      // Cleanup SignalR connection on unmount
      signalRService.disconnect();
    };
  }, []);

  // Initialize badge notifications
  useBadgeNotifications(userId);

  const handleView = () => {
    dispatch(hideMatchModal());
    
    // Navigate to Favorite screen to see matches
    console.log('💖 Navigating to Favorite screen to view matches');
    
    navigate('Favorite');
  };

  const handleStartChat = () => {
    console.log('💬 [App] handleStartChat called with matchModal:', {
      otherUserName: matchModal.otherUserName,
      otherUserId: matchModal.otherUserId,
      matchId: matchModal.matchId,
      petName: matchModal.petName,
    });
    
    dispatch(hideMatchModal());
    
    // Navigate to ChatDetail screen
    navigate('ChatDetail', {
      matchId: matchModal.matchId,
      otherUserId: matchModal.otherUserId,
      userName: matchModal.otherUserName,
    });
    
    console.log('✅ [App] Navigated to ChatDetail with userName:', matchModal.otherUserName);
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
