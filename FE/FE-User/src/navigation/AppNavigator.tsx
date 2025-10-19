import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import Auth Screens
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";
import SignInScreen from "../features/auth/screens/SignInScreen";
import SignUpScreen from "../features/auth/screens/SignUpScreen";
import AddPetInfoScreen from "../features/auth/screens/AddPetInfoScreen";

// Import Other Screens
import HomeScreen from "../features/home/screens/HomeScreen";
import ChatScreen from "../features/chat/screens/ChatScreen";
import NotificationScreen from "../features/notification/screens/NotificationScreen";
import FavoriteScreen from "../features/favorite/screens/FavoriteScreen";
import UserProfileScreen from "../features/profile/screens/UserProfileScreen";
import PetProfileScreen from "../features/profile/screens/PetProfileScreen";
import EditUserProfileScreen from "../features/profile/screens/EditUserProfileScreen";
import EditPetScreen from "../features/profile/screens/EditPetScreen";


export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  AddPetInfo: undefined;
  Home: undefined;
  Match: undefined;
  Chat: undefined;
  Favorite: undefined;
  Profile: undefined;
  Notification: undefined;
  PetProfile: { petId: string };
  EditProfile: undefined;
  EditPet: { petId: string };
  AddPet: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Wrapper component for AddPet to reuse AddPetInfoScreen
const AddPetScreen = (props: any) => {
  return <AddPetInfoScreen {...props} />;
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
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="Favorite" component={FavoriteScreen} />
        <Stack.Screen name="Profile" component={UserProfileScreen} />
        <Stack.Screen name="PetProfile" component={PetProfileScreen} />
        <Stack.Screen name="EditProfile" component={EditUserProfileScreen} />
        <Stack.Screen name="EditPet" component={EditPetScreen} />
        <Stack.Screen name="AddPet" component={AddPetScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

