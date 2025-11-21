import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "PaymentHistory">;

interface PaymentRecord {
  historyId: string;
  statusService: string;
  amount: string;
  startDate: string;
  endDate: string;
  paymentMethod: string;
  status: "success" | "pending" | "failed";
  createdAt: string;
}

const MOCK_PAYMENTS: PaymentRecord[] = [
  {
    historyId: "1",
    statusService: "Premium Monthly",
    amount: "$9.99",
    startDate: "Jan 1, 2025",
    endDate: "Feb 1, 2025",
    paymentMethod: "Visa •••• 4242",
    status: "success",
    createdAt: "Jan 1, 2025",
  },
  {
    historyId: "2",
    statusService: "Premium Monthly",
    amount: "$9.99",
    startDate: "Dec 1, 2024",
    endDate: "Jan 1, 2025",
    paymentMethod: "Visa •••• 4242",
    status: "success",
    createdAt: "Dec 1, 2024",
  },
  {
    historyId: "3",
    statusService: "Premium Monthly",
    amount: "$9.99",
    startDate: "Nov 1, 2024",
    endDate: "Dec 1, 2024",
    paymentMethod: "Visa •••• 4242",
    status: "success",
    createdAt: "Nov 1, 2024",
  },
];

const PaymentHistoryScreen = ({ navigation }: Props) => {
  const [payments] = useState<PaymentRecord[]>(MOCK_PAYMENTS);

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
          {item.startDate} - {item.endDate}
        </Text>
        <Text style={styles.paymentMethod}>
          <Icon name="card-outline" size={12} color={colors.textMedium} />{" "}
          {item.paymentMethod}
        </Text>
      </View>

      {/* Amount & Status */}
      <View style={styles.paymentRight}>
        <Text style={styles.amount}>{item.amount}</Text>
        <View style={styles.statusBadge}>
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.status) },
            ]}
          >
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
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

      {/* Summary Card */}
      {payments.length > 0 && (
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={gradients.primary}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={styles.summaryValue}>
                ${(payments.length * 9.99).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Transactions</Text>
              <Text style={styles.summaryValue}>{payments.length}</Text>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* List */}
      <FlatList
        data={payments}
        keyExtractor={(item) => item.historyId}
        renderItem={renderPaymentItem}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          payments.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />
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
});

export default PaymentHistoryScreen;

