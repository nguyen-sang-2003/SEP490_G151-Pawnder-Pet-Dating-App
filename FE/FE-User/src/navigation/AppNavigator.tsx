import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import Auth Screens
import WelcomeScreen from "../features/auth/screens/WelcomeScreen";
import SignInScreen from "../features/auth/screens/SignInScreen";
import SignUpScreen from "../features/auth/screens/SignUpScreen";
import AddPetInfoScreen from "../features/auth/screens/AddPetInfoScreen";

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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

