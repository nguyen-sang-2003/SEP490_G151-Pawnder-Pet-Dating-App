import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "./src/app/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { useBadgeNotifications } from "./src/hooks/useBadgeNotifications";
import { getUserId, getAuthToken, storeUserId, logout } from "./src/api/auth";
import { getUserIdFromToken, isTokenExpired } from "./src/utils/jwtHelper";
import signalRService from "./src/services/signalr.service";
import MatchModal from "./src/components/MatchModal";
import { selectMatchModal, hideMatchModal } from "./src/features/badge/badgeSlice";
import { AppDispatch } from "./src/app/store";
import { navigate, navigationRef } from "./src/services/navigation.service";

/**
 * App Wrapper with Badge Notifications and Match Modal
 */
function AppWithBadges(): React.JSX.Element {
  const [userId, setUserId] = useState<number | null>(null);
  const dispatch = useDispatch<AppDispatch>();
  const matchModal = useSelector(selectMatchModal);

  // Check for logout flag when app comes to foreground
  useEffect(() => {
    const checkLogoutFlag = async () => {
      try {
        const shouldLogout = await AsyncStorage.getItem('shouldLogout');
        if (shouldLogout === 'true') {
          console.log('🚪 Logout flag detected, navigating to SignIn...');
          await AsyncStorage.removeItem('shouldLogout');
          
          // Disconnect SignalR
          signalRService.disconnect();
          
          // Navigate to SignIn screen
          if (navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'SignIn' as never }],
            });
          }
        }
      } catch (error) {
        console.error('Error checking logout flag:', error);
      }
    };

    // Check immediately
    checkLogoutFlag();

    // Check when app comes to foreground
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkLogoutFlag();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        // Check token first
        const token = await getAuthToken();
        
        if (token) {
          // Check if token is expired
          if (isTokenExpired(token)) {
            console.log('🔒 Token expired - auto logout');
            await logout();
            await AsyncStorage.removeItem('userId');
            setUserId(null);
            
            // Navigate to SignIn
            if (navigationRef.isReady()) {
              navigationRef.reset({
                index: 0,
                routes: [{ name: 'SignIn' as never }],
              });
            }
            return;
          }
          
          // Token is valid - restore userId
          console.log('✅ Token is valid');
          
          // First, try to get userId from AsyncStorage (consistent with all screens)
          let storedUserIdStr = await AsyncStorage.getItem('userId');
          let storedUserId = storedUserIdStr ? parseInt(storedUserIdStr) : null;
          
          // If no userId in AsyncStorage, decode from token
          if (!storedUserId) {
            console.log('🔄 No userId in storage, restoring from token...');
            const userIdFromToken = getUserIdFromToken(token);
            if (userIdFromToken) {
              console.log('✅ Restored userId from token:', userIdFromToken);
              // Store in BOTH AsyncStorage (for app usage) and Keychain (for backup)
              await AsyncStorage.setItem('userId', userIdFromToken.toString());
              await storeUserId(userIdFromToken);
              storedUserId = userIdFromToken;
            } else {
              console.error('❌ Failed to extract userId from token (token may be invalid)');
              // Token is invalid - logout
              await logout();
              await AsyncStorage.removeItem('userId');
              return;
            }
          } else {
            console.log('✅ Found userId in storage:', storedUserId);
          }
          
          // Connect to SignalR if we have a userId
          if (storedUserId) {
            setUserId(storedUserId);
            try {
              console.log('🔌 Connecting to SignalR...');
              await signalRService.connect(storedUserId);
              console.log('✅ SignalR connected');
            } catch (error) {
              console.error('❌ SignalR connection failed:', error);
            }
          }
        } else {
          console.log('ℹ️ No token found - user needs to login');
          // Clean up any stale userId
          await AsyncStorage.removeItem('userId');
          setUserId(null);
        }
      } catch (error) {
        console.error('❌ Error initializing user:', error);
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
