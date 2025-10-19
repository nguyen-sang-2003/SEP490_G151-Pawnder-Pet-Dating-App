import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
// @ts-ignore: bỏ qua lỗi type cho Ionicons
import Icon from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";

// Đồng bộ Tab với RootStackParamList
export type Tab = keyof Pick<
  RootStackParamList,
  "Home" | "Chat" | "Favorite" | "Profile"
>;

interface BottomNavProps {
  active: Tab; // tab hiện tại
}

const BottomNav: React.FC<BottomNavProps> = ({ active }) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // Hàm điều hướng khi bấm tab
  const handlePress = (tab: Tab) => {
    navigation.navigate(tab);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem} onPress={() => handlePress("Home")}>
        <Icon name="home" size={24} color={active === "Home" ? "#FF6EA7" : "#333"} />
        <Text style={[styles.navText, active === "Home" && { color: "#FF6EA7" }]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handlePress("Chat")}>
        <Icon
          name="chatbubble-ellipses"
          size={24}
          color={active === "Chat" ? "#FF6EA7" : "#333"}
        />
        <Text style={[styles.navText, active === "Chat" && { color: "#FF6EA7" }]}>
          Chat
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handlePress("Favorite")}>
        <Icon name="heart" size={24} color={active === "Favorite" ? "#FF6EA7" : "#333"} />
        <Text style={[styles.navText, active === "Favorite" && { color: "#FF6EA7" }]}>
          Favorite
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.navItem} onPress={() => handlePress("Profile")}>
        <Icon name="person" size={24} color={active === "Profile" ? "#FF6EA7" : "#333"} />
        <Text style={[styles.navText, active === "Profile" && { color: "#FF6EA7" }]}>
          Profile
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, marginTop: 4, color: "#333" },
});

export default BottomNav;
