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
import { PendingPolicy } from "../features/policy/api/policyApi";
import { Coordinates, LocationSelectionResult } from "../types/location.types";

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

// Lazy load policy screens
const PolicyAcceptanceScreen = lazy(() => import("../features/policy/screens/PolicyAcceptanceScreen"));
const PolicyListScreen = lazy(() => import("../features/policy/screens/PolicyListScreen"));
const PolicyDetailScreen = lazy(() => import("../features/policy/screens/PolicyDetailScreen"));
const PolicyHistoryScreen = lazy(() => import("../features/policy/screens/PolicyHistoryScreen"));

// Lazy load appointment screens
const MyAppointmentsScreen = lazy(() => import("../features/appointment/screens/MyAppointmentsScreen"));
const AppointmentDetailScreen = lazy(() => import("../features/appointment/screens/AppointmentDetailScreen"));
const CreateAppointmentScreen = lazy(() => import("../features/appointment/screens/CreateAppointmentScreen"));
const CounterOfferScreen = lazy(() => import("../features/appointment/screens/CounterOfferScreen"));
const LocationPickerScreen = lazy(() => import("../features/appointment/screens/LocationPickerScreen"));
const MapPickerScreen = lazy(() => import("../features/appointment/screens/MapPickerScreen"));

// Lazy load event screens
const EventListScreen = lazy(() => import("../features/event/screens/EventListScreen"));
const EventDetailScreen = lazy(() => import("../features/event/screens/EventDetailScreen"));
const SubmitEntryScreen = lazy(() => import("../features/event/screens/SubmitEntryScreen"));


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
  // Policy screens
  PolicyAcceptance: {
    pendingPolicies: PendingPolicy[];
    fromRegistration?: boolean;
  };
  PolicyList: undefined;
  PolicyDetail: {
    policyCode: string;
    policyName: string;
  };
  PolicyHistory: undefined;
  // Appointment screens
  MyAppointments: undefined;
  AppointmentDetail: { appointmentId: number };
  CreateAppointment: {
    matchId: number;
    inviterPetId: number;
    inviteePetId: number;
    inviterPetName: string;
    inviteePetName: string;
  };
  CounterOffer: { appointmentId: number };
  LocationPicker:
    | undefined
    | {
        city?: string;
        allowCustomLocation?: boolean;
      };
  MapPicker:
    | undefined
    | {
        city?: string;
        initialCoordinate?: Coordinates;
        initialAddress?: string;
        initialName?: string;
        returnToCreate?: boolean; // Flag để back 2 màn hình về CreateAppointment
      };
  // Event screens
  EventList: undefined;
  EventDetail: { eventId: number };
  SubmitEntry: { eventId: number };
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

    const checkLogoutInterval = setInterval(async () => {
      const shouldLogout = await AsyncStorage.getItem('shouldLogout');
      if (shouldLogout === 'true') {
        await AsyncStorage.removeItem('shouldLogout');
        setIsAuthenticated(false);
        if (navigationRef.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Welcome' as never }],
          });
        }
      }
    }, 1000);

    return () => clearInterval(checkLogoutInterval);
  }, []);

  useEffect(() => {
    let isSetup = false;

    const setupGlobalNotificationListener = async () => {
      if (isSetup) return;

      try {
        const userIdStr = await AsyncStorage.getItem('userId');
        if (!userIdStr || !isAuthenticated) return;

        const userId = parseInt(userIdStr);

        if (!signalRService.isConnected()) {
          await signalRService.connect(userId);
        }

        const handleNewNotification = (data: any) => {
          refreshBadgesForActivePet(userId).catch(() => { });
        };

        signalRService.on('NewNotification', handleNewNotification);
        isSetup = true;

        return () => {
          signalRService.off('NewNotification', handleNewNotification);
        };
      } catch (error) {
        // Silent fail
      }
    };

    if (isAuthenticated) {
      setupGlobalNotificationListener();
    }
  }, [isAuthenticated]);

  const checkAuth = async () => {
    try {
      const token = await getAuthToken();

      if (token && !isTokenExpired(token)) {
        setIsAuthenticated(true);
      } else if (token && isTokenExpired(token)) {
        await AsyncStorage.removeItem('userId');
        await logout();
        setIsAuthenticated(false);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
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

        {/* Lazy-loaded policy screens */}
        <Stack.Screen
          name="PolicyAcceptance"
          component={LazyScreen(PolicyAcceptanceScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen name="PolicyList" component={LazyScreen(PolicyListScreen)} />
        <Stack.Screen
          name="PolicyDetail"
          component={LazyScreen(PolicyDetailScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen name="PolicyHistory" component={LazyScreen(PolicyHistoryScreen)} />

        {/* Lazy-loaded appointment screens */}
        <Stack.Screen name="MyAppointments" component={LazyScreen(MyAppointmentsScreen)} />
        <Stack.Screen
          name="AppointmentDetail"
          component={LazyScreen(AppointmentDetailScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen
          name="CreateAppointment"
          component={LazyScreen(CreateAppointmentScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="CounterOffer"
          component={LazyScreen(CounterOfferScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="LocationPicker"
          component={LazyScreen(LocationPickerScreen)}
          options={modalScreenOptions}
        />
        <Stack.Screen
          name="MapPicker"
          component={LazyScreen(MapPickerScreen)}
          options={modalScreenOptions}
        />

        {/* Lazy-loaded event screens */}
        <Stack.Screen name="EventList" component={LazyScreen(EventListScreen)} />
        <Stack.Screen
          name="EventDetail"
          component={LazyScreen(EventDetailScreen)}
          options={detailScreenOptions}
        />
        <Stack.Screen
          name="SubmitEntry"
          component={LazyScreen(SubmitEntryScreen)}
          options={modalScreenOptions}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
