import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getPaymentHistoryByUserId } from "../api/paymentApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentHistory">;

interface PaymentRecord {
  historyId: number;
  statusService: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "success" | "pending" | "failed";
  createdAt: string;
}

const PaymentHistoryScreen = ({ navigation }: Props) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPaymentHistory = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);

      // Get userId from AsyncStorage
      const userIdStr = await AsyncStorage.getItem('userId');
      if (!userIdStr) {
        setError("Không tìm thấy thông tin người dùng");
        return;
      }

      const userId = parseInt(userIdStr);
      const data = await getPaymentHistoryByUserId(userId);

      // Map API response to PaymentRecord format
      const mappedPayments: PaymentRecord[] = data.map((item: any) => ({
        historyId: item.historyId,
        statusService: item.statusService === "active" ? "Premium Active" : "Premium Expired",
        amount: item.amount || 0,
        startDate: item.startDate,
        endDate: item.endDate,
        status: item.statusService === "active" ? "success" : "pending",
        createdAt: item.createdAt,
      }));

      setPayments(mappedPayments);
    } catch (err: any) {

      setError(err.message || "Không thể tải lịch sử thanh toán");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadPaymentHistory(true);
  };

  const getStatusColor = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "success":
        return colors.success;
      case "pending":
        return "#FF9800";
      case "failed":
        return colors.error;
      default:
        return colors.textMedium;
    }
  };

  const getStatusIcon = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "success":
        return "checkmark-circle";
      case "pending":
        return "time-outline";
      case "failed":
        return "close-circle";
      default:
        return "ellipse-outline";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const renderPaymentItem = ({ item }: { item: PaymentRecord }) => (
    <TouchableOpacity style={styles.paymentCard} activeOpacity={0.7}>
      {/* Status Icon */}
      <View
        style={[
          styles.statusIcon,
          { backgroundColor: `${getStatusColor(item.status)}15` },
        ]}
      >
        <Icon
          name={getStatusIcon(item.status)}
          size={24}
          color={getStatusColor(item.status)}
        />
      </View>

      {/* Payment Info */}
      <View style={styles.paymentInfo}>
        <Text style={styles.serviceName}>{item.statusService}</Text>
        <Text style={styles.dateRange}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)}
        </Text>
        <Text style={styles.paymentMethod}>
          <Icon name="qr-code-outline" size={12} color={colors.textMedium} />{" "}
          Chuyển khoản QR
        </Text>
      </View>

      {/* Amount & Status */}
      <View style={styles.paymentRight}>
        <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status === "success" ? "Thành công" : item.status === "pending" ? "Chờ xử lý" : "Thất bại"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="receipt-outline" size={64} color={colors.textLabel} />
      </View>
      <Text style={styles.emptyTitle}>No Payment History</Text>
      <Text style={styles.emptyText}>
        Your payment transactions will appear here
      </Text>
      <TouchableOpacity
        style={styles.premiumButton}
        onPress={() => navigation.navigate("Premium")}
      >
        <LinearGradient
          colors={gradients.primary}
          style={styles.premiumGradient}
        >
          <Icon name="diamond-outline" size={20} color={colors.white} />
          <Text style={styles.premiumText}>Upgrade to Premium</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử thanh toán...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadPaymentHistory()}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Summary Card */}
          {payments.length > 0 && (
            <View style={styles.summaryCard}>
              <LinearGradient
                colors={gradients.primary}
                style={styles.summaryGradient}
              >
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Tổng chi tiêu</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Giao dịch</Text>
                  <Text style={styles.summaryValue}>{payments.length}</Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* List */}
          <FlatList
            data={payments}
            keyExtractor={(item) => item.historyId.toString()}
            renderItem={renderPaymentItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={[
              styles.listContent,
              payments.length === 0 && styles.listContentEmpty,
            ]}
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
        </>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
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
    fontSize: 20,
    fontWeight: "bold",
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadows.medium,
  },
  summaryGradient: {
    flexDirection: "row",
    padding: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  summaryDivider: {
    width: 1,
    backgroundColor: colors.white,
    opacity: 0.3,
    marginHorizontal: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  paymentInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  dateRange: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: colors.textMedium,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.cardBackgroundLight,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.textDark,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  premiumButton: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  premiumGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  premiumText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.textMedium,
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.white,
  },
});

export default PaymentHistoryScreen;

