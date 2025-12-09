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
import { useTranslation } from "react-i18next";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentHistory">;

interface PaymentRecord {
  historyId: number;
  statusService: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "active" | "expired" | "pending";
  createdAt: string;
  durationMonths: number;
  daysRemaining: number;
}

const PaymentHistoryScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
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
        setError(t("payment.history.userNotFound"));
        return;
      }

      const userId = parseInt(userIdStr);
      const data = await getPaymentHistoryByUserId(userId);

      // Map API response to PaymentRecord format
      const mappedPayments: PaymentRecord[] = data.map((item: any) => {
        // Calculate duration in months from startDate and endDate
        const start = new Date(item.startDate);
        const end = new Date(item.endDate);
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        
        // Calculate days remaining
        const today = new Date();
        const endDate = new Date(item.endDate);
        const diffTime = endDate.getTime() - today.getTime();
        const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        
        // Determine status based on statusService and dates
        let status: "active" | "expired" | "pending" = "pending";
        if (item.statusService === "active" && daysRemaining > 0) {
          status = "active";
        } else if (item.statusService === "expired" || daysRemaining <= 0) {
          status = "expired";
        }

        return {
          historyId: item.historyId,
          statusService: item.statusService,
          amount: typeof item.amount === 'number' ? item.amount : parseInt(item.amount) || 0,
          startDate: item.startDate,
          endDate: item.endDate,
          status,
          createdAt: item.createdAt,
          durationMonths: diffMonths || 1,
          daysRemaining,
        };
      });

      setPayments(mappedPayments);
    } catch (err: any) {

      setError(err.message || t("payment.history.loadError"));
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
      case "active":
        return colors.success;
      case "pending":
        return "#FF9800";
      case "expired":
        return colors.textMedium;
      default:
        return colors.textMedium;
    }
  };

  const getStatusIcon = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "active":
        return "checkmark-circle";
      case "pending":
        return "time-outline";
      case "expired":
        return "close-circle-outline";
      default:
        return "ellipse-outline";
    }
  };

  const getStatusText = (status: PaymentRecord["status"]) => {
    switch (status) {
      case "active":
        return t("payment.history.status.active");
      case "pending":
        return t("payment.history.status.pending");
      case "expired":
        return t("payment.history.status.expired");
      default:
        return "";
    }
  };

  const getPlanName = (durationMonths: number) => {
    switch (durationMonths) {
      case 1:
        return t("payment.premium.plans.month1");
      case 3:
        return t("payment.premium.plans.month3");
      case 6:
        return t("payment.premium.plans.month6");
      case 12:
        return t("payment.premium.plans.month12");
      default:
        return `Premium ${durationMonths} tháng`;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
      let dateStr = dateString;
      if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
        dateStr = dateStr + 'Z';
      }
      const date = new Date(dateStr);
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
    <View style={styles.paymentCard}>
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
        <View style={styles.planNameRow}>
          <Text style={styles.serviceName}>{getPlanName(item.durationMonths)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(item.status)}15` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {getStatusText(item.status)}
            </Text>
          </View>
        </View>
        
        <Text style={styles.dateRange}>
          {formatDate(item.startDate)} → {formatDate(item.endDate)}
        </Text>
        
        {item.status === "active" && item.daysRemaining > 0 && (
          <View style={styles.remainingRow}>
            <Icon name="time-outline" size={12} color={colors.success} />
            <Text style={styles.remainingText}>
              {t("payment.history.daysRemaining", { count: item.daysRemaining })}
            </Text>
          </View>
        )}
        
        <View style={styles.paymentMethodRow}>
          <Icon name="qr-code-outline" size={12} color={colors.textLabel} />
          <Text style={styles.paymentMethod}>{t("payment.history.paymentMethod")}</Text>
        </View>
      </View>

      {/* Amount */}
      <View style={styles.paymentRight}>
        <Text style={[styles.amount, item.amount > 0 ? {} : styles.amountZero]}>
          {item.amount > 0 ? formatCurrency(item.amount) : "—"}
        </Text>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="receipt-outline" size={64} color={colors.textLabel} />
      </View>
      <Text style={styles.emptyTitle}>{t("payment.history.empty.title")}</Text>
      <Text style={styles.emptyText}>
        {t("payment.history.empty.subtitle")}
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
          <Text style={styles.premiumText}>{t("payment.history.empty.upgradePremium")}</Text>
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
        <Text style={styles.headerTitle}>{t("payment.history.title")}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t("payment.history.loading")}</Text>
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
            <Text style={styles.retryButtonText}>{t("payment.history.retry")}</Text>
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
                  <Text style={styles.summaryLabel}>{t("payment.history.summary.totalSpent")}</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(payments.reduce((sum, p) => sum + p.amount, 0))}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t("payment.history.summary.transactions")}</Text>
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
  planNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textDark,
  },
  dateRange: {
    fontSize: 13,
    color: colors.textMedium,
    marginBottom: 4,
  },
  remainingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  remainingText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: "600",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  paymentMethod: {
    fontSize: 12,
    color: colors.textLabel,
  },
  paymentRight: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  amountZero: {
    color: colors.textLabel,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 11,
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

