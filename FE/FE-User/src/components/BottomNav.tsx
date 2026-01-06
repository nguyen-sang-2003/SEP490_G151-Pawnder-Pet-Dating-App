import React, { useCallback, useMemo } from "react";
import { View, TouchableOpacity, StyleSheet, Platform, Text } from "react-native";
// @ts-ignore: bỏ qua lỗi type cho Ionicons
import Icon from "react-native-vector-icons/Ionicons";
import LinearGradient from "react-native-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../navigation/AppNavigator";
import { colors, gradients } from "../theme";
import { useAppSelector } from "../app/hooks";
import { selectTotalChatBadge, selectFavoriteBadge, selectNotificationBadge } from "../features/badge/badgeSlice";

// Đồng bộ Tab với RootStackParamList
export type Tab = keyof Pick<
  RootStackParamList,
  "Home" | "Chat" | "Favorite" | "Profile"
>;

interface BottomNavProps {
  active: Tab; // tab hiện tại
}

const BottomNav: React.FC<BottomNavProps> = React.memo(({ active }) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  // Get badge counts from Redux
  const chatBadge = useAppSelector(selectTotalChatBadge); // Total badge (user chats + expert chats)
  const favoriteBadge = useAppSelector(selectFavoriteBadge);
  const notificationBadge = useAppSelector(selectNotificationBadge);
  
  const handlePress = useCallback((tab: Tab) => {
    if (tab === "Chat") {
      navigation.navigate("Chat", {});
    } else {
      navigation.navigate(tab as any);
    }
  }, [navigation]);

  const navItems = useMemo(() => [
    { 
      key: "Home" as Tab, 
      labelKey: "navigation.home",
      icon: "paw", 
      iconOutline: "paw-outline",
      gradient: gradients.home,
      gradientLight: ["rgba(233, 30, 99, 0.25)", "rgba(255, 107, 157, 0.25)"],
      shadowColor: colors.homeStart,
    },
    { 
      key: "Chat" as Tab, 
      labelKey: "navigation.chat",
      icon: "chatbubbles", 
      iconOutline: "chatbubbles-outline",
      gradient: gradients.chat,
      gradientLight: ["rgba(255, 154, 118, 0.25)", "rgba(255, 126, 179, 0.25)"],
      shadowColor: colors.chatStart,
    },
    { 
      key: "Favorite" as Tab, 
      labelKey: "navigation.favorite",
      icon: "heart", 
      iconOutline: "heart-outline",
      gradient: gradients.favorite,
      gradientLight: ["rgba(255, 126, 168, 0.25)", "rgba(255, 189, 212, 0.25)"],
      shadowColor: colors.favoriteStart,
    },
    { 
      key: "Profile" as Tab, 
      labelKey: "navigation.profile",
      icon: "person", 
      iconOutline: "person-outline",
      gradient: gradients.profile,
      gradientLight: ["rgba(255, 168, 204, 0.25)", "rgba(255, 224, 240, 0.25)"],
      shadowColor: colors.profileStart,
    },
  ], []);

  return (
    <View style={styles.bottomNavContainer}>
      <View style={styles.bottomNav}>
        {navItems.map((item) => {
          const isActive = active === item.key;
          
          const badgeCount = 
            item.key === "Home" ? notificationBadge :
            item.key === "Chat" ? chatBadge : 
            item.key === "Favorite" ? favoriteBadge : 
            0;
          
          return (
            <TouchableOpacity
              key={item.key}
              style={styles.navItem}
              onPress={() => handlePress(item.key)}
              activeOpacity={0.7}
              accessibilityLabel={t(item.labelKey)}
              accessibilityRole="button"
            >
              <View>
                {isActive ? (
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.activeBackground,
                      {
                        shadowColor: item.shadowColor,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.5,
                        shadowRadius: 16,
                        elevation: 10,
                      }
                    ]}
                  >
                    <Icon 
                      name={item.icon} 
                      size={28} 
                      color={colors.white} 
                    />
                  </LinearGradient>
                ) : (
                  <View style={styles.inactiveBackground}>
                    <Icon 
                      name={item.iconOutline} 
                      size={28} 
                      color={colors.textLight} 
                    />
                  </View>
                )}
                
                {/* Badge indicator */}
                {badgeCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  // Dating App Style Bottom Nav - Modern & Clean
  bottomNavContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    backgroundColor: "transparent",
  },
  bottomNav: {
    backgroundColor: colors.white,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 157, 0.15)",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF3B30",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default BottomNav;
