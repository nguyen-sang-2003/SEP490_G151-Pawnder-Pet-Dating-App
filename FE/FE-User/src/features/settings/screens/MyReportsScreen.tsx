import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";

type Props = NativeStackScreenProps<RootStackParamList, "MyReports">;

interface Report {
  id: string;
  reportedUser: string;
  reason: string;
  status: "pending" | "resolved" | "rejected";
  createdAt: Date;
  resolution?: string;
}

const MyReportsScreen = ({ navigation }: Props) => {
  // Mock data - in production, fetch from API: GET /report/user/{userReportId}
  const [reports] = useState<Report[]>([
    {
      id: "1",
      reportedUser: "User123",
      reason: "Spam or Advertising",
      status: "pending",
      createdAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: "2",
      reportedUser: "FakeProfile456",
      reason: "Fake Profile",
      status: "resolved",
      createdAt: new Date(Date.now() - 86400000 * 7),
      resolution: "Account has been suspended after investigation.",
    },
    {
      id: "3",
      reportedUser: "Spammer789",
      reason: "Inappropriate Content",
      status: "rejected",
      createdAt: new Date(Date.now() - 86400000 * 14),
      resolution: "No violation found after review.",
    },
  ]);

  const getStatusColor = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "resolved":
        return "#4CAF50";
      case "rejected":
        return "#E94D6B";
      default:
        return colors.textMedium;
    }
  };

  const getStatusIcon = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return "time-outline";
      case "resolved":
        return "checkmark-circle";
      case "rejected":
        return "close-circle";
      default:
        return "help-circle";
    }
  };

  const getStatusLabel = (status: Report["status"]) => {
    switch (status) {
      case "pending":
        return "Under Review";
      case "resolved":
        return "Resolved";
      case "rejected":
        return "No Action Taken";
      default:
        return status;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderReport = ({ item }: { item: Report }) => (
    <TouchableOpacity style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportHeaderLeft}>
          <Icon
            name={getStatusIcon(item.status)}
            size={24}
            color={getStatusColor(item.status)}
          />
          <View style={styles.reportHeaderText}>
            <Text style={styles.reportedUser}>{item.reportedUser}</Text>
            <Text style={styles.reportDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}15` },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.reportBody}>
        <View style={styles.reasonRow}>
          <Icon name="flag-outline" size={16} color={colors.textMedium} />
          <Text style={styles.reasonText}>{item.reason}</Text>
        </View>

        {item.resolution && (
          <View style={styles.resolutionBox}>
            <Text style={styles.resolutionLabel}>Response:</Text>
            <Text style={styles.resolutionText}>{item.resolution}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="document-text-outline" size={80} color={colors.textLabel} />
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptyText}>
        You haven't reported any users.{"\n"}
        Your report history will appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.background}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Reports</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats */}
        {reports.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Icon name="flag" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{reports.length}</Text>
              <Text style={styles.statLabel}>Total Reports</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>
                {reports.filter((r) => r.status === "resolved").length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>

            <View style={styles.statCard}>
              <Icon name="time" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>
                {reports.filter((r) => r.status === "pending").length}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        )}

        {/* Reports List */}
        <FlatList
          data={reports}
          renderItem={renderReport}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.md,
    alignItems: "center",
    ...shadows.small,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.textDark,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 4,
  },

  // List
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Report Card
  reportCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  reportHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reportHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  reportHeaderText: {
    flex: 1,
  },
  reportedUser: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
  },
  reportDate: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Report Body
  reportBody: {
    gap: 12,
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reasonText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  resolutionBox: {
    backgroundColor: colors.cardBackgroundLight,
    padding: 12,
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  resolutionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.primary,
    marginBottom: 4,
  },
  resolutionText: {
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
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

export default MyReportsScreen;

