import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform } from "react-native";
// @ts-ignore: bỏ qua lỗi type cho Ionicons
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors, gradients, shadows } from "../theme";

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
    if (tab === "Chat") {
      navigation.navigate("Chat", {});
    } else {
      navigation.navigate(tab as any);
    }
  };

  // Nav items config - Each tab has unique color theme
  const navItems = [
    { 
      key: "Home" as Tab, 
      icon: "paw", 
      iconOutline: "paw-outline",
      gradient: ["#FF6EA7", "#FF9BC0"], // Pink - Pawnder brand
      shadowColor: "#FF6EA7",
    },
    { 
      key: "Chat" as Tab, 
      icon: "chatbubbles", 
      iconOutline: "chatbubbles-outline",
      gradient: ["#4FC3F7", "#29B6F6"], // Blue - Communication
      shadowColor: "#29B6F6",
    },
    { 
      key: "Favorite" as Tab, 
      icon: "heart", 
      iconOutline: "heart-outline",
      gradient: ["#FF6B9D", "#EF476F"], // Red Pink - Love
      shadowColor: "#EF476F",
    },
    { 
      key: "Profile" as Tab, 
      icon: "person", 
      iconOutline: "person-outline",
      gradient: ["#9C27B0", "#BA68C8"], // Purple - Personal
      shadowColor: "#BA68C8",
    },
  ];

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => handlePress(item.key)}
              activeOpacity={0.7}
            >
              {isActive ? (
                <LinearGradient
                  colors={item.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.activeBackground,
                    {
                      shadowColor: item.shadowColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.4,
                      shadowRadius: 12,
                      elevation: 8,
                    }
                  ]}
                >
                  <Icon 
                    name={item.icon} 
                    size={26} 
                    color={colors.white} 
                  />
                </LinearGradient>
              ) : (
                <View style={styles.inactiveBackground}>
                  <Icon 
                    name={item.iconOutline} 
                    size={26} 
                    color={colors.textMedium} 
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Dating App Style Bottom Nav - Modern & Clean
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === "ios" ? 20 : 10,
    backgroundColor: "transparent",
  },
  bottomNav: {
    backgroundColor: colors.whiteWarm,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "rgba(255,110,167,0.15)",
    shadowColor: "#FF6EA7",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    // Shadow applied inline for each tab color
  },
  inactiveBackground: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});

export default BottomNav;
