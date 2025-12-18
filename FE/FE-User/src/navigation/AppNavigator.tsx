import React, { useState, useEffect, Suspense, lazy } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { navigationRef } from "../services/navigation.service";
import { getAuthToken, logout } from "../features/auth/api/authApi";
import { isTokenExpired } from "../utils/jwtHelper";
import {
  defaultScreenOptions,
  modalScreenOptions,
  detailScreenOptions,
  navigationTheme
} from "./navigationConfig";
import signalRService from "../services/signalr.service";
import { refreshBadgesForActivePet } from "../utils/badgeRefresh";

// Import critical screens immediately (needed for initial render)
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";
import SignInScreen from "../features/auth/screens/SignInScreen";
import HomeScreen from "../features/home/screens/HomeScreen";
import AddPetBasicInfoScreen from "../features/auth/screens/AddPetBasicInfoScreen";

// Lazy load non-critical auth screens
const SignUpScreen = lazy(() => import("../features/auth/screens/SignUpScreen"));
const AddPetCharacteristicsScreen = lazy(() => import("../features/auth/screens/AddPetCharacteristicsScreen"));
const AddPetPhotosScreen = lazy(() => import("../features/auth/screens/AddPetPhotosScreen"));
const OnboardingPreferencesScreen = lazy(() => import("../features/auth/screens/OnboardingPreferencesScreen"));
const OTPVerificationScreen = lazy(() => import("../features/auth/screens/OTPVerificationScreen"));
const ForgotPasswordScreen = lazy(() => import("../features/auth/screens/ForgotPasswordScreen"));
const ResetPasswordScreen = lazy(() => import("../features/auth/screens/ResetPasswordScreen"));

// Lazy load other screens
const FilterScreen = lazy(() => import("../features/home/screens/FilterScreen"));
const ChatScreen = lazy(() => import("../features/chat/screens/ChatScreen"));
const ChatDetailScreen = lazy(() => import("../features/chat/screens/ChatDetailScreen"));
const AIChatScreen = lazy(() => import("../features/chat/screens/AIChatScreen"));
const AIChatListScreen = lazy(() => import("../features/chat/screens/AIChatListScreen"));
const ExpertChatListScreen = lazy(() => import("../features/expert/screens/ExpertChatListScreen"));
const ExpertChatScreen = lazy(() => import("../features/expert/screens/ExpertChatScreen"));
const NotificationScreen = lazy(() => import("../features/notification/screens/NotificationScreen"));
const FavoriteScreen = lazy(() => import("../features/favorite/screens/FavoriteScreen"));
const UserProfileScreen = lazy(() => import("../features/profile/screens/UserProfileScreen"));
const PetProfileScreen = lazy(() => import("../features/profile/screens/PetProfileScreen"));
const EditUserProfileScreen = lazy(() => import("../features/profile/screens/EditUserProfileScreen"));
const EditPetScreen = lazy(() => import("../features/profile/screens/EditPetScreen"));
const HelpAndSupportScreen = lazy(() => import("../features/settings/screens/HelpAndSupportScreen"));
const ResourceDetailScreen = lazy(() => import("../features/settings/screens/ResourceDetailScreen"));
const PremiumScreen = lazy(() => import("../features/payment/screens/PremiumScreen"));
const ReportScreen = lazy(() => import("../features/report/screens/ReportScreen"));
const MyReportsScreen = lazy(() => import("../features/report/screens/MyReportsScreen"));
const ExpertConfirmationScreen = lazy(() => import("../features/settings/screens/ExpertConfirmationScreen"));
const SettingsScreen = lazy(() => import("../features/settings/screens/SettingsScreen"));
const BlockedUsersScreen = lazy(() => import("../features/report/screens/BlockedUsersScreen"));
const PaymentHistoryScreen = lazy(() => import("../features/payment/screens/PaymentHistoryScreen"));
const QRPaymentScreen = lazy(() => import("../features/payment/screens/QRPaymentScreen"));
const ChangePasswordScreen = lazy(() => import("../features/settings/screens/ChangePasswordScreen"));


export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  OTPVerification: {
    email: string;
    userData?: {
      FullName: string;
      Gender: string;
      Email: string;
      Password: string;
    };
  };
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  AddPetBasicInfo: { 
    isFromProfile?: boolean; 
    petId?: number; 
    petName?: string; 
    breed?: string; 
    description?: string;
    aiResults?: Array<{
      attributeName: string;
      optionName?: string | null;
      value?: number | null;
      attributeId?: number | null;
      optionId?: number | null;
    }>;
  };
  AddPetCharacteristics: {
    petId: number;
    isFromProfile?: boolean;
    petName?: string;
    breed?: string;
    description?: string;
    aiResults?: Array<{
      attributeName: string;
      optionName?: string | null;
      value?: number | null;
      attributeId?: number | null;
      optionId?: number | null;
    }>;
  };
  AddPetPhotos: { 
    petId: number; 
    isFromProfile?: boolean; 
    petName?: string; 
    breed?: string; 
    description?: string;
    aiResults?: Array<{
      attributeName: string;
      optionName?: string | null;
      value?: number | null;
      attributeId?: number | null;
      optionId?: number | null;
    }>;
  };
  OnboardingPreferences: undefined;
  Home: undefined;
  FilterScreen: undefined;
  Chat: { matchId?: number }; // Optional matchId để navigate từ Favorite
  ChatDetail: {
    matchId: number;
    otherUserId: number;
    userName: string;
    userAvatar?: any;
  };
  AIChatList: undefined;
  AIChat: { chatId?: string };
  ExpertChatList: undefined;
  ExpertChat: { expertId?: number; expertName?: string; chatExpertId?: number };
  Favorite: undefined;
  Profile: undefined;
  Notification: undefined;
  PetProfile: { petId: string; fromFavorite?: boolean; fromChat?: boolean };
  EditProfile: { userId?: number };
  EditPet: { petId: string };
  AddPet: undefined;
  Settings: undefined;
  HelpAndSupport: undefined;
  ResourceDetail: { type: string };
  Premium: undefined;
  Report: { userId: string; userName: string };
  MyReports: undefined;
  ExpertConfirmation: undefined;
  BlockedUsers: undefined;
  PaymentHistory: undefined;
  QRPayment: {
    planId: string;
    planName: string;
    amount: number;
    duration: string;
  };
  ChangePassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Loading fallback component
const LoadingFallback = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
    <ActivityIndicator size="large" color="#FF6EA7" />
  </View>
);

// Wrapper component for lazy-loaded screens
const LazyScreen = (Component: React.LazyExoticComponent<any>) => {
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

// Wrapper component for AddPet from Profile to use new flow
const AddPetScreen = (props: any) => {
  return <AddPetBasicInfoScreen {...props} route={{ ...props.route, params: { isFromProfile: true } }} />;
};

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();

    // Listen for logout flag changes
    const checkLogoutInterval = setInterval(async () => {
      const shouldLogout = await AsyncStorage.getItem('shouldLogout');
      if (shouldLogout === 'true') {
        console.log('🚪 Logout flag detected, redirecting to Welcome...');
        await AsyncStorage.removeItem('shouldLogout');
        setIsAuthenticated(false);
        // Navigate to Welcome screen
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Welcome' as never }],
          });
        }
      }
    }, 1000); // Check every second

    return () => clearInterval(checkLogoutInterval);
  }, []);

  // Setup global SignalR listener for notifications (works from any screen)
  useEffect(() => {
    let isSetup = false;

    const setupGlobalNotificationListener = async () => {
      if (isSetup) return;

      try {
        const userIdStr = await AsyncStorage.getItem('userId');
        if (!userIdStr || !isAuthenticated) return;

        const userId = parseInt(userIdStr);
        console.log('🔔 [AppNavigator] Setting up global notification listener for userId:', userId);

        // Connect to SignalR if not already connected
        if (!signalRService.isConnected()) {
          await signalRService.connect(userId);
          console.log('✅ [AppNavigator] SignalR connected');
        }

        // Listen for new notifications globally
        const handleNewNotification = (data: any) => {
          console.log('🔔 [AppNavigator] New notification received via SignalR:', data);

          // Refresh badge count immediately
          refreshBadgesForActivePet(userId).then(() => {
            console.log('✅ [AppNavigator] Badge refreshed after notification');
          }).catch(err => {

          });
        };

        signalRService.on('NewNotification', handleNewNotification);
        isSetup = true;
        console.log('✅ [AppNavigator] Global notification listener setup complete');

        // Cleanup on unmount
        return () => {
          signalRService.off('NewNotification', handleNewNotification);
          console.log('🧹 [AppNavigator] Cleaned up global notification listener');
        };
      } catch (error) {

      }
    };

    if (isAuthenticated) {
      setupGlobalNotificationListener();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();
      
      // ✅ Check both existence AND validity of token
      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
      } else if (token && isTokenExpired(token)) {
        console.log('🔒 [AppNavigator] Token expired - auto logout');
        // Clear expired token
        await AsyncStorage.removeItem('userId');
        await logout();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.log('❌ [AppNavigator] Error checking auth:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
        <ActivityIndicator size="large" color="#FF6EA7" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={isAuthenticated ? "Home" : "Welcome"}
        screenOptions={defaultScreenOptions}
      >
        {/* Critical screens - loaded immediately */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* Lazy-loaded auth screens */}
        <Stack.Screen name="SignUp" component={LazyScreen(SignUpScreen)} />
        <Stack.Screen name="OTPVerification" component={LazyScreen(OTPVerificationScreen)} />
        <Stack.Screen name="ForgotPassword" component={LazyScreen(ForgotPasswordScreen)} />
        <Stack.Screen name="ResetPassword" component={LazyScreen(ResetPasswordScreen)} />
        <Stack.Screen name="AddPetBasicInfo" component={AddPetBasicInfoScreen} />
        <Stack.Screen name="AddPetCharacteristics" component={LazyScreen(AddPetCharacteristicsScreen)} />
        <Stack.Screen name="AddPetPhotos" component={LazyScreen(AddPetPhotosScreen)} />
        <Stack.Screen name="OnboardingPreferences" component={LazyScreen(OnboardingPreferencesScreen)} />

        {/* Lazy-loaded main screens */}
        <Stack.Screen
          name="FilterScreen"
          component={LazyScreen(FilterScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen name="Chat" component={LazyScreen(ChatScreen)} />
        <Stack.Screen
          name="ChatDetail"
          component={LazyScreen(ChatDetailScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen name="AIChatList" component={LazyScreen(AIChatListScreen)} />
        <Stack.Screen
          name="AIChat"
          component={LazyScreen(AIChatScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen name="ExpertChatList" component={LazyScreen(ExpertChatListScreen)} />
        <Stack.Screen
          name="ExpertChat"
          component={LazyScreen(ExpertChatScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen name="Notification" component={LazyScreen(NotificationScreen)} />
        <Stack.Screen name="Favorite" component={LazyScreen(FavoriteScreen)} />
        <Stack.Screen name="Profile" component={LazyScreen(UserProfileScreen)} />
        <Stack.Screen
          name="PetProfile"
          component={LazyScreen(PetProfileScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen name="EditProfile" component={LazyScreen(EditUserProfileScreen)} />
        <Stack.Screen name="EditPet" component={LazyScreen(EditPetScreen)} />
        <Stack.Screen name="AddPet" component={AddPetScreen} />

        {/* Lazy-loaded settings screens */}
        <Stack.Screen name="HelpAndSupport" component={LazyScreen(HelpAndSupportScreen)} />
        <Stack.Screen
          name="ResourceDetail"
          component={LazyScreen(ResourceDetailScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen
          name="Premium"
          component={LazyScreen(PremiumScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen name="Report" component={LazyScreen(ReportScreen)} />
        <Stack.Screen name="MyReports" component={LazyScreen(MyReportsScreen)} />
        <Stack.Screen name="ExpertConfirmation" component={LazyScreen(ExpertConfirmationScreen)} />
        <Stack.Screen name="Settings" component={LazyScreen(SettingsScreen)} />
        <Stack.Screen name="BlockedUsers" component={LazyScreen(BlockedUsersScreen)} />
        <Stack.Screen name="PaymentHistory" component={LazyScreen(PaymentHistoryScreen)} />
        <Stack.Screen
          name="QRPayment"
          component={LazyScreen(QRPaymentScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen name="ChangePassword" component={LazyScreen(ChangePasswordScreen)} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;