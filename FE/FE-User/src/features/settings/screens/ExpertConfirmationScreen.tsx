import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getUserExpertConfirmations, ExpertConfirmation } from "../../../api";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "ExpertConfirmation">;

const ExpertConfirmationScreen = ({ navigation }: Props) => {
  const [requests, setRequests] = useState<ExpertConfirmation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadRequests();
    }, [])
  );

  const loadRequests = async () => {
    try {
      setLoading(true);
      
      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) {
        console.error("❌ No userId found");
        return;
      }

      const userId = parseInt(userIdStr);
      const data = await getUserExpertConfirmations(userId);
      setRequests(data);
      console.log("✅ Loaded expert confirmations:", data.length);
    } catch (error: any) {
      console.error("❌ Error loading expert confirmations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "#FF9800";
      case "answered":
      case "approved":
      case "confirmed":
        return "#4CAF50";
      case "rejected":
        return "#E94D6B";
      default:
        return colors.textMedium;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "time-outline";
      case "answered":
      case "approved":
      case "confirmed":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "Đang chờ";
      case "answered":
      case "approved":
      case "confirmed":
        return "Đã trả lời";
      case "rejected":
        return "Bị từ chối";
      default:
        return status || "Không rõ";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      return diffHours === 0 ? "Vừa xong" : `${diffHours} giờ trước`;
    }
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const renderRequest = ({ item }: { item: ExpertConfirmation }) => (
    <View style={styles.requestCard}>
      {/* Header */}
      <View style={styles.requestHeader}>
        <View style={styles.statusBadge}>
          <Icon
            name={getStatusIcon(item.status)}
            size={16}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
        <Text style={styles.requestTime}>{formatTime(item.createdAt)}</Text>
      </View>

      {/* Chat Info */}
      <View style={styles.chatInfo}>
        <Icon name="chatbubbles-outline" size={18} color="#9C27B0" />
        <Text style={styles.chatTitle}>Chat AI #{item.chatAiId}</Text>
      </View>

      {/* User Request Message */}
      {item.message && (
        <View style={styles.questionBox}>
          <View style={styles.questionHeader}>
            <Icon name="document-text-outline" size={16} color={colors.primary} />
            <Text style={styles.questionLabel}>Nội dung yêu cầu:</Text>
          </View>
          <Text style={styles.questionText}>{item.message}</Text>
        </View>
      )}

      {/* Expert Response */}
      {(item.status.toLowerCase() === "answered" || 
        item.status.toLowerCase() === "approved" ||
        item.status.toLowerCase() === "confirmed") && (item as any).resultMessage && (
        <View style={styles.expertResponseBox}>
          <View style={styles.expertResponseHeader}>
            <Icon name="shield-checkmark" size={18} color="#4CAF50" />
            <Text style={styles.expertResponseLabel}>
              Phản hồi của chuyên gia
            </Text>
          </View>
          <Text style={styles.expertResponseText}>{(item as any).resultMessage}</Text>
          {item.updatedAt && (
            <Text style={styles.expertResponseTime}>
              {formatTime(item.updatedAt)}
            </Text>
          )}
        </View>
      )}

      {/* Pending Status */}
      {item.status.toLowerCase() === "pending" && (
        <View style={styles.pendingBox}>
          <Icon name="hourglass-outline" size={20} color="#FF9800" />
          <Text style={styles.pendingText}>
            Đang chờ chuyên gia xem xét. Bạn sẽ nhận được thông báo khi có phản hồi.
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="shield-checkmark-outline" size={80} color={colors.textLabel} />
      <Text style={styles.emptyTitle}>Chưa có yêu cầu chuyên gia</Text>
      <Text style={styles.emptyText}>
        Khi bạn cần chuyên gia xác nhận lời khuyên của AI, các yêu cầu sẽ xuất hiện ở đây
      </Text>
    </View>
  );

  const pendingCount = requests.filter((r) => r.status.toLowerCase() === "pending").length;
  const answeredCount = requests.filter((r) => 
    ["answered", "approved", "confirmed"].includes(r.status.toLowerCase())
  ).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.background} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yêu cầu chuyên gia</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {!loading && requests.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Đã trả lời</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="hourglass" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Chờ xử lý</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="documents" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{requests.length}</Text>
              <Text style={styles.statLabel}>Tổng cộng</Text>
            </View>
          </View>
        )}

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Icon name="information-circle" size={20} color="#4CAF50" />
          <Text style={styles.infoBannerText}>
            Các chuyên gia thú y được chứng nhận sẽ xem xét câu trả lời của AI
          </Text>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải yêu cầu...</Text>
          </View>
        ) : (
          /* Requests List */
          <FlatList
            data={requests}
            renderItem={renderRequest}
            keyExtractor={(item) => `${item.userId}-${item.chatAiId}-${item.expertId}`}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
          />
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
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
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    padding: 14,
    borderRadius: radius.md,
    alignItems: "center",
    ...shadows.small,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 6,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMedium,
    marginTop: 2,
  },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.2)",
  },
  infoBannerText: {
    flex: 1,
    fontSize: 13,
    color: "#4CAF50",
    lineHeight: 18,
  },

  // List
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  // Request Card
  requestCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadows.medium,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.cardBackgroundLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  requestTime: {
    fontSize: 12,
    color: colors.textMedium,
  },

  // Chat Info
  chatInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  chatTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#9C27B0",
  },

  // Question Box
  questionBox: {
    backgroundColor: colors.primaryPastel,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  questionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  questionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
  },
  questionText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // AI Response Box
  aiResponseBox: {
    backgroundColor: colors.purplePastel,
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: "#9C27B0",
  },
  aiResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  aiResponseLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9C27B0",
  },
  aiResponseText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // Expert Response Box
  expertResponseBox: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    padding: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  expertResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  expertResponseLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },
  expertResponseText: {
    fontSize: 15,
    color: colors.textDark,
    lineHeight: 22,
    marginBottom: 8,
  },
  expertResponseTime: {
    fontSize: 11,
    color: colors.textMedium,
    textAlign: "right",
  },

  // Pending Box
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  pendingText: {
    flex: 1,
    fontSize: 13,
    color: "#F57C00",
    lineHeight: 18,
  },

  // Loading State
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMedium,
    marginTop: 16,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
});

export default ExpertConfirmationScreen;

