import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import Auth Screens
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";
import SignInScreen from "../features/auth/screens/SignInScreen";
import SignUpScreen from "../features/auth/screens/SignUpScreen";
import AddPetInfoScreen from "../features/auth/screens/AddPetInfoScreen";
import AddPetPhotosScreen from "../features/auth/screens/AddPetPhotosScreen";
import AddPetDetailsScreen from "../features/auth/screens/AddPetDetailsScreen";

// Import Other Screens
import HomeScreen from "../features/home/screens/HomeScreen";
import ChatScreen from "../features/chat/screens/ChatScreen";
import ChatDetailScreen from "../features/chat/screens/ChatDetailScreen";
import AIChatScreen from "../features/chat/screens/AIChatScreen";
import NotificationScreen from "../features/notification/screens/NotificationScreen";
import FavoriteScreen from "../features/favorite/screens/FavoriteScreen";
import UserProfileScreen from "../features/profile/screens/UserProfileScreen";
import PetProfileScreen from "../features/profile/screens/PetProfileScreen";
import EditUserProfileScreen from "../features/profile/screens/EditUserProfileScreen";
import EditPetScreen from "../features/profile/screens/EditPetScreen";
import HelpAndSupportScreen from "../features/settings/screens/HelpAndSupportScreen";
import ResourceDetailScreen from "../features/settings/screens/ResourceDetailScreen";
import PremiumScreen from "../features/settings/screens/PremiumScreen";
import PrivacyAndSafetyScreen from "../features/settings/screens/PrivacyAndSafetyScreen";
import ShareProfileScreen from "../features/settings/screens/ShareProfileScreen";
import UserPreferenceScreen from "../features/settings/screens/UserPreferenceScreen";


export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  AddPetInfo: undefined;
  AddPetPhotos: { isFromProfile?: boolean };
  AddPetDetails: { photos: string[]; isFromProfile?: boolean };
  Home: undefined;
  Chat: undefined;
  ChatDetail: { chatId: string; userName: string; userAvatar?: any };
  AIChat: undefined;
  Favorite: undefined;
  Profile: undefined;
  Notification: undefined;
  PetProfile: { petId: string };
  EditProfile: undefined;
  EditPet: { petId: string };
  AddPet: undefined;
  HelpAndSupport: undefined;
  ResourceDetail: { type: string };
  Premium: undefined;
  PrivacyAndSafety: undefined;
  ShareProfile: undefined;
  UserPreference: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapper component for AddPet to use new flow
const AddPetScreen = (props: any) => {
  return <AddPetPhotosScreen {...props} route={{ ...props.route, params: { isFromProfile: true } }} />;
};

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="AddPetInfo" component={AddPetInfoScreen} />
        <Stack.Screen name="AddPetPhotos" component={AddPetPhotosScreen} />
        <Stack.Screen name="AddPetDetails" component={AddPetDetailsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="ChatDetail" component={ChatDetailScreen} />
        <Stack.Screen name="AIChat" component={AIChatScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Favorite" component={FavoriteScreen} />
        <Stack.Screen name="Profile" component={UserProfileScreen} />
        <Stack.Screen name="PetProfile" component={PetProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditUserProfileScreen} />
        <Stack.Screen name="EditPet" component={EditPetScreen} />
        <Stack.Screen name="AddPet" component={AddPetScreen} />
        <Stack.Screen name="HelpAndSupport" component={HelpAndSupportScreen} />
        <Stack.Screen name="ResourceDetail" component={ResourceDetailScreen} />
        <Stack.Screen name="Premium" component={PremiumScreen} />
        <Stack.Screen name="PrivacyAndSafety" component={PrivacyAndSafetyScreen} />
        <Stack.Screen name="ShareProfile" component={ShareProfileScreen} />
        <Stack.Screen name="UserPreference" component={UserPreferenceScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
