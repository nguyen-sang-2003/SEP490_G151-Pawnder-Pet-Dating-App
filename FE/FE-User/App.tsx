import React, { useEffect, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { AppState } from "react-native";
import "./src/locales"; // Initialize i18n before app renders
import AsyncStorage from "@react-native-async-storage/async-storage";
import { store } from "./src/app/store";
import AppNavigator from "./src/navigation/AppNavigator";
import { useBadgeNotifications } from "./src/hooks/useBadgeNotifications";
import { getUserId, getAuthToken, storeUserId, logout } from "./src/features/auth/api/authApi";
import { getUserIdFromToken, isTokenExpired } from "./src/utils/jwtHelper";
import signalRService from "./src/services/signalr.service";
import MatchModal from "./src/features/match/components/MatchModal";
import { selectMatchModal, hideMatchModal } from "./src/features/badge/badgeSlice";
import { AppDispatch } from "./src/app/store";
import { navigate, navigationRef } from "./src/services/navigation.service";
import PolicyModalProvider from "./src/components/PolicyModalProvider";

/**
 * App Wrapper with Badge Notifications and Match Modal
 */
function AppWithBadges(): React.JSX.Element {
  const [userId, setUserId] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const dispatch = useDispatch<AppDispatch>();
  const matchModal = useSelector(selectMatchModal);

  // Check token validity first (before anything else)
  useEffect(() => {
    const checkTokenValidity = async () => {
      try {
        const token = await getAuthToken();
        
        if (token && isTokenExpired(token)) {
          setUserId(null);
          await AsyncStorage.removeItem('userId');
          await logout();
          setIsInitializing(false);
          
          if (navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'SignIn' as never }],
            });
          }
          return;
        }
        
        setIsInitializing(false);
      } catch (error) {
        setIsInitializing(false);
      }
    };

    checkTokenValidity();
  }, []);

  // Check for logout flag when app comes to foreground
  useEffect(() => {
    const checkLogoutFlag = async () => {
      try {
        const shouldLogout = await AsyncStorage.getItem('shouldLogout');
        if (shouldLogout === 'true') {
          await AsyncStorage.removeItem('shouldLogout');
          
          signalRService.disconnect();
          
          if (navigationRef.isReady()) {
            navigationRef.reset({
              index: 0,
              routes: [{ name: 'SignIn' as never }],
            });
          }
        }
      } catch (error) {
        // Silent fail
      }
    };

    checkLogoutFlag();

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkLogoutFlag();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // Initialize user only if token is valid
  useEffect(() => {
    if (isInitializing) {
      return;
    }

    const initializeUser = async () => {
      try {
        const token = await getAuthToken();
        
        if (token) {
          let storedUserIdStr = await AsyncStorage.getItem('userId');
          let storedUserId = storedUserIdStr ? parseInt(storedUserIdStr) : null;
          
          if (!storedUserId) {
            const userIdFromToken = getUserIdFromToken(token);
            if (userIdFromToken) {
              await AsyncStorage.setItem('userId', userIdFromToken.toString());
              await storeUserId(userIdFromToken);
              storedUserId = userIdFromToken;
            } else {
              await logout();
              await AsyncStorage.removeItem('userId');
              return;
            }
          }
          
          if (storedUserId) {
            setUserId(storedUserId);
            try {
              await signalRService.connect(storedUserId);
            } catch (error) {
              // SignalR connection failed
            }
          }
        } else {
          await AsyncStorage.removeItem('userId');
          setUserId(null);
        }
      } catch (error) {
        // Error initializing user
      }
    };

    initializeUser();

    return () => {
      signalRService.disconnect();
    };
  }, [isInitializing]);

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
      userName: matchModal.petName || matchModal.otherUserName, // Ưu tiên petName, fallback về otherUserName
    });
  };

  const handleCloseModal = () => {
    dispatch(hideMatchModal());
  };

  return (
    <>
      <PolicyModalProvider>
        <AppNavigator />
      </PolicyModalProvider>
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
