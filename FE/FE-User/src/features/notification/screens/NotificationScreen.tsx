import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getNotifications, markNotificationAsRead, markAllNotificationsAsRead, Notification } from "../../../api/notification";
import { useFocusEffect } from "@react-navigation/native";
import { refreshBadgesForActivePet } from "../../../utils/badgeRefresh";

type Props = NativeStackScreenProps<RootStackParamList, "Notification">;

const NotificationScreen = ({ navigation }: Props) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  // Get time ago string
  const getTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "Just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  // Load notifications from API
  const loadNotifications = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading notifications...');
      
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        setLoading(false);
        return;
      }

      const userId = parseInt(userIdStr);
      setCurrentUserId(userId);

      console.log('🔄 Loading notifications for user:', userId);
      const data = await getNotifications(userId);
      
      // Sort by createdAt descending (newest first)
      const sortedData = data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setNotifications(sortedData);
      console.log('✅ Loaded', sortedData.length, 'notifications');
    } catch (error) {
      console.error('❌ Error loading notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load notifications on mount and when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [])
  );

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!currentUserId) return;
    
    try {
      await markAllNotificationsAsRead(currentUserId);
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      console.log('✅ Marked all notifications as read');
      
      // Refresh badge count after marking all as read
      await refreshBadgesForActivePet(currentUserId);
    } catch (error) {
      console.error('❌ Error marking all as read:', error);
    }
  };

  // 🚀 OPTIMIZATION: Memoize helper functions with useCallback
  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "expert_reply":
      case "expert":
        return { name: "medical", color: "#FFFFFF" };
      case "system":
        return { name: "sparkles", color: "#FFFFFF" };
      default:
        return { name: "notifications", color: "#FFFFFF" };
    }
  }, []);

  const getNotificationBgColor = useCallback((type: string) => {
    switch (type) {
      case "expert_reply":
      case "expert":
        return ["#FF6EA7", "#FF9BC0"]; // Pink gradient for expert
      case "system":
        return ["#FFB8D6", "#FF8FB7"]; // Lighter pink for system
      default:
        return ["#FFB8D6", "#FF8FB7"];
    }
  }, []);

  const handleNotificationPress = async (item: Notification) => {
    // Mark as read
    if (!item.isRead) {
      try {
        await markNotificationAsRead(item.notificationId);
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.notificationId === item.notificationId ? { ...n, isRead: true } : n)
        );
        
        // Refresh badge count after marking as read
        if (currentUserId) {
          await refreshBadgesForActivePet(currentUserId);
        }
      } catch (error) {
        console.error('❌ Error marking notification as read:', error);
      }
    }

    // Navigate based on type
    if (item.type === "expert") {
      navigation.navigate("ExpertConfirmation" as any);
    }
    // System notifications don't need navigation
  };

  // 🚀 OPTIMIZATION: Memoize renderNotification with useCallback
  const renderNotification = useCallback(({ item }: { item: Notification }) => {
    const type = item.type || 'system';
    const iconConfig = getNotificationIcon(type);
    const bgColors = getNotificationBgColor(type);
    const timeAgo = item.createdAt ? getTimeAgo(item.createdAt) : 'Unknown';
    const isUnread = !item.isRead;

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          isUnread && styles.notificationUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <LinearGradient 
            colors={bgColors} 
            style={styles.iconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name={iconConfig.name} size={26} color={iconConfig.color} />
          </LinearGradient>
          {isUnread && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle} numberOfLines={1}>
              {item.title || 'Notification'}
            </Text>
            {type === "expert_reply" || type === "expert" ? (
              <View style={styles.expertBadge}>
                <Icon name="shield-checkmark" size={12} color="#FF6EA7" />
                <Text style={styles.expertBadgeText}>Expert</Text>
              </View>
            ) : null}
          </View>
          <Text
            style={[
              styles.notificationMessage,
              isUnread && styles.notificationMessageBold,
            ]}
            numberOfLines={3}
          >
            {item.message || 'No message'}
          </Text>
          <View style={styles.notificationFooter}>
            <Icon name="time-outline" size={14} color={colors.textLabel} />
            <Text style={styles.notificationTime}>{timeAgo}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [getNotificationIcon, getNotificationBgColor, handleNotificationPress]);

  // 🚀 OPTIMIZATION: Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (filterType === "all") return true;
      if (filterType === "unread") return !n.isRead;
      if (filterType === "system") return n.type === "system";
      if (filterType === "expert") return n.type === "expert_reply" || n.type === "expert";
      return true;
    });
  }, [notifications, filterType]);

  // 🚀 OPTIMIZATION: Memoize unreadCount calculation
  const unreadCount = useMemo(() => 
    notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  // 🚀 OPTIMIZATION: Memoize filter tabs configuration
  const filterTabs = useMemo(() => [
    { id: "all", label: "All", icon: "apps" },
    { id: "unread", label: "Unread", icon: "mail-unread", badge: unreadCount },
    { id: "system", label: "System", icon: "notifications" },
    { id: "expert", label: "Expert", icon: "medical" },
  ], [unreadCount]);

  // Show loading state
  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <Text style={styles.headerSubtitle}>
                {unreadCount} unread notification{unreadCount > 1 ? "s" : ""}
              </Text>
            )}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={unreadCount === 0}
        >
          <Icon 
            name="checkmark-done" 
            size={22} 
            color={unreadCount > 0 ? colors.primary : colors.textLabel} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs - Horizontal ScrollView */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
        style={styles.filterScroll}
      >
        {filterTabs.map((tab) => {
          const isActive = filterType === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilterType(tab.id)}
              activeOpacity={0.7}
            >
              <Icon 
                name={tab.icon} 
                size={18} 
                color={isActive ? colors.white : colors.textMedium} 
              />
              <Text style={isActive ? styles.filterTextActive : styles.filterText}>
                {tab.label}
              </Text>
              {tab.badge !== undefined && tab.badge > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.notificationId.toString()}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          // 🚀 OPTIMIZATION: FlatList performance props
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={15}
          windowSize={10}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <LinearGradient
            colors={["#FFB8D6", "#FF8FB7"]}
            style={styles.emptyIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon
              name="notifications-off-outline"
              size={48}
              color={colors.white}
            />
          </LinearGradient>
          <Text style={styles.emptyText}>
            {filterType === "all" 
              ? "No notifications yet" 
              : filterType === "unread"
                ? "All caught up!"
                : `No ${filterType} notifications`
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {filterType === "all" 
              ? "You'll see system and expert notifications here"
              : filterType === "unread"
                ? "You have no unread notifications"
                : filterType === "system"
                  ? "System notifications will appear here"
                  : "Expert reply notifications will appear here"
            }
          </Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.primary,
    marginTop: 2,
  },
  markAllButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.small,
  },

  // Filter Tabs - Horizontal Scroll
  filterScroll: {
    maxHeight: 60,
    marginBottom: 16,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: "rgba(255, 110, 167, 0.15)",
    gap: 8,
    ...shadows.small,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderWidth: 0,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  filterText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textMedium,
  },
  filterTextActive: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: "#FF3B30",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  filterBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "bold",
  },

  // Notification Item
  notificationItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: radius.xl,
    ...shadows.medium,
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.1)",
  },
  notificationUnread: {
    backgroundColor: "#FFF8FB",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    position: "relative",
    marginRight: 14,
    marginTop: 2,
  },
  iconGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FF3B30",
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  notificationContent: {
    flex: 1,
    paddingTop: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: colors.textDark,
    letterSpacing: -0.3,
  },
  expertBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 110, 167, 0.2)",
  },
  expertBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary,
  },
  notificationMessage: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 22,
    marginBottom: 8,
  },
  notificationMessageBold: {
    fontWeight: "500",
    color: colors.textDark,
  },
  notificationFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  notificationTime: {
    fontSize: 13,
    color: colors.textLabel,
    fontWeight: "500",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptySubtext: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500",
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 12,
    fontWeight: "600",
  },
});

export default NotificationScreen;
