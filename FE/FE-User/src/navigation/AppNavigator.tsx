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
};

const Stack = createNativeStackNavigator<RootStackParamList>();

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

