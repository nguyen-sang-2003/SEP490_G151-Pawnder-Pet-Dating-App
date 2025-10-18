import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, Text, StyleSheet } from "react-native";
import LinearGradient from "react-native-linear-gradient";

// Temporary placeholder screen
const PlaceholderScreen = () => {
  return (
    <LinearGradient
      colors={["#FFF0F7", "#FFDDE9"]}
      style={styles.container}
    >
      <Text style={styles.title}>🐾 Pawnder</Text>
      <Text style={styles.subtitle}>Pet Matching App</Text>
      <Text style={styles.info}>Base codebase setup complete!</Text>
      <Text style={styles.note}>Screens will be added soon...</Text>
    </LinearGradient>
  );
};

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
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
        <Stack.Screen name="Welcome" component={PlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#FF6EA7",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#333",
    marginBottom: 32,
  },
  info: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  note: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});

export default AppNavigator;

