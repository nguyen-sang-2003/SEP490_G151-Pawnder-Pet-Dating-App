import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSelector } from "react-redux";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, radius, shadows } from "../../../theme";
import { getUserExpertChats, ExpertChatListItem } from "../../../api/expert-chat";
import { selectUnreadExpertChats } from "../../badge/badgeSlice";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertChatList">;

const ExpertChatListScreen = ({ navigation }: Props) => {
  const [loading, setLoading] = useState(false);
  const [expertChats, setExpertChats] = useState<ExpertChatListItem[]>([]);
  const unreadExpertChats = useSelector(selectUnreadExpertChats);

  useFocusEffect(
    useCallback(() => {
      loadExpertChats();
    }, [])
  );

  const loadExpertChats = async () => {
    try {
      setLoading(true);
      
      // Get current user ID
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        console.log('❌ No userId found');
        return;
      }
      
      const userId = parseInt(userIdStr);
      console.log('📞 Loading expert chats for user:', userId);
      
      // Call API to get expert chats
      const chats = await getUserExpertChats(userId);
      console.log('✅ Got expert chats:', chats);
      
      setExpertChats(chats);
    } catch (error: any) {
      console.error("❌ Error loading expert chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    let dateStr = dateString;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr + 'Z';
    }
    
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return diffDays === 1 ? 'Hôm qua' : `${diffDays} ngày trước`;
    }
    
    if (diffHours > 0) {
      return `${diffHours} giờ trước`;
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins > 0) {
      return `${diffMins} phút trước`;
    }
    
    return 'Vừa xong';
  };

  const renderExpertChat = ({ item }: { item: ExpertChatListItem }) => {
    const formattedTime = formatTime(item.time);
    const isUnread = unreadExpertChats.includes(item.chatExpertId);
    
    return (
      <TouchableOpacity
        style={[styles.chatItem, isUnread && styles.chatItemUnread]}
        onPress={() =>
          navigation.navigate("ExpertChat", {
            chatExpertId: item.chatExpertId,
            expertId: item.expertId,
            expertName: item.expertName,
          })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={["#4CAF50", "#66BB6A"]}
            style={styles.avatar}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="medical" size={24} color={colors.white} />
          </LinearGradient>
          {item.isOnline && <View style={styles.onlineDot} />}
          <View style={styles.expertBadge}>
            <Icon name="shield-checkmark" size={10} color="#4CAF50" />
          </View>
        </View>

        {/* Content */}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.expertName, isUnread && styles.expertNameUnread]} numberOfLines={1}>
                {item.expertName}
              </Text>
            </View>
            <Text style={styles.time}>{formattedTime}</Text>
          </View>
          <Text style={styles.specialty} numberOfLines={1}>
            {item.specialty}
          </Text>
          <View style={styles.messageRow}>
            <Text
              style={[
                styles.lastMessage,
                isUnread && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#4CAF50", "#66BB6A"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconContainer}>
              <Icon name="medical" size={24} color={colors.white} />
            </View>
            <Text style={styles.headerTitle}>Chuyên gia</Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>
          Tư vấn từ các chuyên gia thú y
        </Text>
      </LinearGradient>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <LinearGradient
          colors={["#E8F5E9", "#F1F8E9"]}
          style={styles.infoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Icon name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoText}>
            Chúng tôi sẽ cố gắng giải đáp thắc mắc của bạn sớm nhất
          </Text>
        </LinearGradient>
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : expertChats.length > 0 ? (
        <FlatList
          data={expertChats}
          keyExtractor={(item) => item.id}
          renderItem={renderExpertChat}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <LinearGradient
            colors={["#4CAF50", "#66BB6A"]}
            style={styles.emptyIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Icon name="medical-outline" size={48} color={colors.white} />
          </LinearGradient>
          <Text style={styles.emptyTitle}>Chưa có cuộc trò chuyện</Text>
          <Text style={styles.emptyText}>
            Gửi câu hỏi để được chuyên gia tư vấn
          </Text>
          <TouchableOpacity
            style={styles.askButton}
            onPress={() => navigation.navigate("ExpertConfirmation" as any)}
          >
            <LinearGradient
              colors={["#4CAF50", "#66BB6A"]}
              style={styles.askButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Icon name="add-circle" size={20} color={colors.white} />
              <Text style={styles.askButtonText}>Đặt câu hỏi mới</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },

  // Header
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    ...shadows.medium,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginTop: 4,
    marginLeft: 52,
  },

  // Info Card
  infoCard: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  infoGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#2E7D32",
    fontWeight: "500",
    lineHeight: 18,
  },

  // Chat Item
  listContent: {
    paddingBottom: 20,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: radius.xl,
    ...shadows.small,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  onlineDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 3,
    borderColor: colors.white,
  },
  expertBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.white,
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  nameContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  expertName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  time: {
    fontSize: 12,
    color: colors.textLabel,
    fontWeight: "500",
  },
  specialty: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "600",
    marginBottom: 4,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  unreadDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    marginLeft: 8,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
  chatItemUnread: {
    backgroundColor: colors.white,
    borderWidth: 3, // Viền to hơn
    borderColor: "#4CAF50", // Xanh đậm
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  expertNameUnread: {
    fontWeight: "700",
  },
  lastMessageUnread: {
    fontWeight: "800", // Rất bold
    color: colors.textDark,
  },

  // Loading
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

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    ...shadows.large,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  askButton: {
    borderRadius: radius.xl,
    overflow: "hidden",
    ...shadows.medium,
  },
  askButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  askButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.white,
  },
});

export default ExpertChatListScreen;

