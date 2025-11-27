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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'answered' | 'pending'>('all');

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

        return;
      }

      const userId = parseInt(userIdStr);
      const data = await getUserExpertConfirmations(userId);
      setRequests(data);
      console.log("✅ Loaded expert confirmations:", data.length);
    } catch (error: any) {

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
    // Parse UTC time (backend sends UTC, add 'Z' if not present)
    const utcString = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    const date = new Date(utcString);
    const now = new Date();

    // Calculate difference
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Same day - show relative time
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? "Vừa xong" : `${diffMinutes} phút trước`;
      }
      return `${diffHours} giờ trước`;
    }

    // Yesterday
    if (diffDays === 1) return "Hôm qua";

    // Within a week
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Older - show full date time (will be in local timezone UTC+7)
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderRequest = ({ item }: { item: ExpertConfirmation }) => (
    <View style={styles.requestCard}>
      {/* Header with Status */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Icon name="shield-checkmark" size={20} color="#4CAF50" />
          <Text style={styles.cardTitle}>Yêu cầu chuyên gia</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}20` },
          ]}
        >
          <Icon
            name={getStatusIcon(item.status)}
            size={12}
            color={getStatusColor(item.status)}
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* User Request Message */}
      {item.userQuestion && (
        <View style={styles.messageSection}>
          <Text style={styles.messageSectionLabel}>Nội dung yêu cầu:</Text>
          <View style={styles.messageBox}>
            <Icon name="document-text-outline" size={14} color={colors.textMedium} style={{ marginTop: 2 }} />
            <Text style={styles.messageText} numberOfLines={5}>
              {item.userQuestion}
            </Text>
          </View>
        </View>
      )}

      {/* Expert Response */}
      {(item.status.toLowerCase() === "answered" ||
        item.status.toLowerCase() === "approved" ||
        item.status.toLowerCase() === "confirmed") && item.message && (
          <View style={styles.expertResponseSection}>
            <View style={styles.expertResponseHeader}>
              <Icon name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.expertResponseHeaderText}>Phản hồi của chuyên gia:</Text>
            </View>
            <Text style={styles.expertResponseText}>{item.message}</Text>
            {item.updatedAt && (
              <Text style={styles.expertResponseTime}>
                Trả lời lúc: {formatTime(item.updatedAt)}
              </Text>
            )}
          </View>
        )}

      {/* Pending Status */}
      {item.status.toLowerCase() === "pending" && (
        <View style={styles.pendingBox}>
          <Icon name="hourglass-outline" size={16} color="#FF9800" />
          <Text style={styles.pendingText}>
            Đang chờ chuyên gia xem xét. Bạn sẽ nhận được thông báo khi có phản hồi.
          </Text>
        </View>
      )}

      {/* Footer Date */}
      <View style={styles.cardFooter}>
        <Icon name="time-outline" size={12} color={colors.textLabel} />
        <Text style={styles.footerDate}>{formatTime(item.createdAt)}</Text>
      </View>
    </View>
  );

  const renderEmpty = () => {
    let emptyMessage = "Khi bạn cần chuyên gia xác nhận lời khuyên của AI, các yêu cầu sẽ xuất hiện ở đây";
    let emptyTitle = "Chưa có yêu cầu chuyên gia";

    if (selectedFilter === 'answered') {
      emptyTitle = "Chưa có yêu cầu được trả lời";
      emptyMessage = "Các yêu cầu đã được chuyên gia trả lời sẽ xuất hiện ở đây";
    } else if (selectedFilter === 'pending') {
      emptyTitle = "Chưa có yêu cầu đang chờ";
      emptyMessage = "Các yêu cầu đang chờ chuyên gia xử lý sẽ xuất hiện ở đây";
    }

    return (
      <View style={styles.emptyContainer}>
        <Icon name="shield-checkmark-outline" size={80} color={colors.textLabel} />
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  };

  const pendingCount = requests.filter((r) => r.status.toLowerCase() === "pending").length;
  const answeredCount = requests.filter((r) =>
    ["answered", "approved", "confirmed"].includes(r.status.toLowerCase())
  ).length;

  // Filter requests based on selected filter
  const filteredRequests = requests.filter((r) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'pending') return r.status.toLowerCase() === 'pending';
    if (selectedFilter === 'answered') {
      return ["answered", "approved", "confirmed"].includes(r.status.toLowerCase());
    }
    return true;
  });

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

        {/* Stats - Filterable */}
        {!loading && requests.length > 0 && (
          <View style={styles.statsContainer}>
            {/* Answered */}
            <TouchableOpacity
              style={[
                styles.statCard,
                selectedFilter === 'answered' && styles.statCardActive,
              ]}
              onPress={() => setSelectedFilter('answered')}
              activeOpacity={0.7}
            >
              <Icon name="shield-checkmark" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{answeredCount}</Text>
              <Text style={styles.statLabel}>Đã trả lời</Text>
            </TouchableOpacity>

            {/* Pending */}
            <TouchableOpacity
              style={[
                styles.statCard,
                selectedFilter === 'pending' && styles.statCardActive,
              ]}
              onPress={() => setSelectedFilter('pending')}
              activeOpacity={0.7}
            >
              <Icon name="hourglass" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>Chờ xử lý</Text>
            </TouchableOpacity>

            {/* Total (All) */}
            <TouchableOpacity
              style={[
                styles.statCard,
                selectedFilter === 'all' && styles.statCardActive,
              ]}
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.7}
            >
              <Icon name="documents" size={24} color={colors.primary} />
              <Text style={styles.statNumber}>{requests.length}</Text>
              <Text style={styles.statLabel}>Tổng cộng</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Info */}
        {!loading && requests.length > 0 && (
          <View style={styles.filterInfo}>
            <Text style={styles.filterInfoText}>
              {selectedFilter === 'all'
                ? `Hiển thị tất cả ${filteredRequests.length} yêu cầu`
                : selectedFilter === 'answered'
                  ? `${filteredRequests.length} yêu cầu đã được trả lời`
                  : `${filteredRequests.length} yêu cầu đang chờ xử lý`}
            </Text>
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
            data={filteredRequests}
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
    borderWidth: 2,
    borderColor: "transparent",
  },
  statCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
    transform: [{ scale: 1.02 }],
    ...shadows.medium,
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

  // Filter Info
  filterInfo: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
  },
  filterInfoText: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: "600",
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
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadows.small,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginBottom: 12,
  },

  // Message Section
  messageSection: {
    marginBottom: 12,
  },
  messageSectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 8,
  },
  messageBox: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8F8F8",
    padding: 12,
    borderRadius: radius.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // Expert Response Section
  expertResponseSection: {
    backgroundColor: "#F1F8F4",
    padding: 12,
    borderRadius: radius.md,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  expertResponseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  expertResponseHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2E7D32",
  },
  expertResponseText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
    marginBottom: 6,
  },
  expertResponseTime: {
    fontSize: 11,
    color: colors.textMedium,
    fontStyle: "italic",
  },

  // Pending Box
  pendingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF8E1",
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#FFE082",
    marginBottom: 12,
  },
  pendingText: {
    flex: 1,
    fontSize: 12,
    color: "#F57C00",
    lineHeight: 18,
  },

  // Chat Expert Button
  chatExpertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(76, 175, 80, 0.3)",
    marginBottom: 12,
  },
  chatExpertButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#4CAF50",
  },

  // Card Footer
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  footerDate: {
    fontSize: 11,
    color: colors.textLabel,
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

