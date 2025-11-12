import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { useDispatch } from "react-redux";
import { resetNotificationBadge } from "../../badge/badgeSlice";
import { AppDispatch } from "../../../app/store";

type Props = NativeStackScreenProps<RootStackParamList, "Notification">;

interface NotificationItem {
  id: string;
  type: "match" | "like" | "message" | "system" | "expert_reply";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  avatar?: any;
  userId?: string;
  expertRequestId?: string;
}

const notifications: NotificationItem[] = [
  {
    id: "1",
    type: "expert_reply",
    title: "Expert Confirmed Your Question",
    message: "Dr. Nguyen reviewed your cat nutrition question",
    time: "10 minutes ago",
    isRead: false,
    expertRequestId: "req1",
  },
  {
    id: "2",
    type: "match",
    title: "It's a Match!",
    message: "You and Nguyễn Văn A liked each other",
    time: "5 minutes ago",
    isRead: false,
    avatar: require("../../../assets/cat_avatar.png"),
    userId: "user1",
  },
  {
    id: "3",
    type: "like",
    title: "New Like",
    message: "Trần Thị B liked your pet Coco",
    time: "1 hour ago",
    isRead: false,
    avatar: require("../../../assets/cat_avatar.png"),
    userId: "user2",
  },
  {
    id: "4",
    type: "message",
    title: "New Message",
    message: "Lê Văn C sent you a message",
    time: "2 hours ago",
    isRead: true,
    avatar: require("../../../assets/cat_avatar.png"),
    userId: "user3",
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to Pawnder!",
    message: "Complete your pet profile to get more matches",
    time: "1 day ago",
    isRead: true,
  },
];

const NotificationScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();

  // Reset notification badge when entering this screen
  useEffect(() => {
    console.log('🔔 Resetting notification badge to 0');
    dispatch(resetNotificationBadge());
  }, [dispatch]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "expert_reply":
        return { name: "shield-checkmark", color: "#4CAF50" };
      case "match":
        return { name: "heart", color: colors.primary };
      case "like":
        return { name: "heart-outline", color: colors.primary };
      case "message":
        return { name: "chatbubble-ellipses", color: "#9C27B0" };
      case "system":
        return { name: "information-circle", color: colors.textMedium };
      default:
        return { name: "notifications", color: colors.textMedium };
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case "expert_reply":
        return ["#4CAF50", "#81C784"];
      case "match":
        return ["#FF6EA7", "#FF9BC0"];
      case "like":
        return ["#FFC2D6", "#FFE5EC"];
      case "message":
        return ["#BA68C8", "#E1BEE7"];
      case "system":
        return ["#E0E0E0", "#F5F5F5"];
      default:
        return ["#E0E0E0", "#F5F5F5"];
    }
  };

  const handleNotificationPress = (item: NotificationItem) => {
    if (item.type === "expert_reply") {
      // Navigate to expert confirmation screen
      navigation.navigate("ExpertConfirmation" as any);
    } else if (item.type === "match" || item.type === "like") {
      // Navigate to profile or favorite
      if (item.userId) {
        navigation.navigate("Favorite");
      }
    } else if (item.type === "message") {
      navigation.navigate("Chat" as any);
    }
  };

  const renderNotification = ({ item }: { item: NotificationItem }) => {
    const iconConfig = getNotificationIcon(item.type);
    const bgColors = getNotificationBgColor(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem,
          !item.isRead && styles.notificationUnread,
        ]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={styles.iconContainer}>
          <LinearGradient colors={bgColors} style={styles.iconGradient}>
            <Icon name={iconConfig.name} size={24} color={iconConfig.color} />
          </LinearGradient>
          {!item.isRead && <View style={styles.unreadDot} />}
        </View>

        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{item.time}</Text>
          </View>
          <Text
            style={[
              styles.notificationMessage,
              !item.isRead && styles.notificationMessageBold,
            ]}
            numberOfLines={2}
          >
            {item.message}
          </Text>
        </View>

        {item.avatar && (
          <Image source={item.avatar} style={styles.notificationAvatar} />
        )}
      </TouchableOpacity>
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

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
        <TouchableOpacity style={styles.markAllButton}>
          <Icon name="checkmark-done" size={22} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterTabActive}>
          <Text style={styles.filterTextActive}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterTab}>
          <Text style={styles.filterText}>Messages</Text>
        </TouchableOpacity>
      </View>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={renderNotification}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon
            name="notifications-off-outline"
            size={80}
            color={colors.textLabel}
          />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications here when someone likes or matches with you
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
    marginBottom: 20,
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

  // Filter Tabs
  filterContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.whiteWarm,
  },
  filterTabActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    ...shadows.small,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textMedium,
  },
  filterTextActive: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.white,
  },

  // Notification Item
  notificationItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 12,
    borderRadius: radius.md,
    ...shadows.small,
  },
  notificationUnread: {
    backgroundColor: "#FFF5F8",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  iconContainer: {
    position: "relative",
    marginRight: 12,
  },
  iconGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FF3B30",
    borderWidth: 2,
    borderColor: colors.whiteWarm,
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  notificationTime: {
    fontSize: 12,
    color: colors.textMedium,
  },
  notificationMessage: {
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  notificationMessageBold: {
    fontWeight: "500",
    color: colors.textDark,
  },
  notificationAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: 8,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.textDark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default NotificationScreen;

