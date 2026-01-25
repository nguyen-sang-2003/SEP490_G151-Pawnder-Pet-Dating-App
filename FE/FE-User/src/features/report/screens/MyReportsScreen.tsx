import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getMyReports, Report } from "../api/reportApi";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Props = NativeStackScreenProps<RootStackParamList, "MyReports">;

const MyReportsScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'resolved' | 'pending'>('all');

  useFocusEffect(
    useCallback(() => {
      loadReports();
    }, [])
  );

  const loadReports = async () => {
    try {
      setLoading(true);

      const userIdStr = await AsyncStorage.getItem("userId");
      if (!userIdStr) {

        return;
      }

      const userId = parseInt(userIdStr);
      const data = await getMyReports(userId);
      setReports(data);
    } catch (error: any) {

    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadReports();
    setRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
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

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "pending";
      case "resolved":
        return "resolved";
      case "rejected":
        return "rejected";
      default:
        return status || "";
    }
  };

  const formatDate = (dateString: string) => {
    // Parse UTC time (backend sends UTC, add 'Z' if not present)
    const utcString = dateString.endsWith('Z') ? dateString : dateString + 'Z';
    const date = new Date(utcString);
    const now = new Date();

    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes <= 1 ? t('report.myReports.time.justNow') : t('report.myReports.time.minutesAgo', { count: diffMinutes });
      }
      return t('report.myReports.time.hoursAgo', { count: diffHours });
    }
    if (diffDays === 1) return t('report.myReports.time.yesterday');
    if (diffDays < 7) return t('report.myReports.time.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('report.myReports.time.weeksAgo', { count: Math.floor(diffDays / 7) });

    // Older - show full date time
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderReport = ({ item }: { item: Report }) => {
    return (
      <View style={styles.reportCard}>
        {/* Header with Status */}
        <View style={styles.reportIdRow}>
          <View style={styles.reportIdLeft}>
            <Icon name="flag" size={18} color={colors.error} />
            <Text style={styles.reportTitle}>{t('report.myReports.reportMessage')}</Text>
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
              {t(`report.myReports.status.${getStatusLabel(item.status) || 'unknown'}`)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Reported User */}
        {item.reportedUser ? (
          <View style={styles.infoRow}>
            <Icon name="person-outline" size={16} color={colors.textMedium} />
            <Text style={styles.infoLabel}>{t('report.myReports.reportedUser')}</Text>
            <Text style={styles.infoValue}>
              {item.reportedUser.fullName}
            </Text>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Icon name="information-circle-outline" size={16} color="#FF9800" />
            <Text style={styles.warningText}>
              {t('report.myReports.userUnavailable')}
            </Text>
          </View>
        )}

        {/* Reason */}
        <View style={styles.infoRow}>
          <Icon name="alert-circle-outline" size={16} color={colors.error} />
          <Text style={styles.infoLabel}>{t('report.myReports.reason')}</Text>
          <Text style={[styles.infoValue, { color: colors.error, fontWeight: "600" }]}>
            {item.reason}
          </Text>
        </View>

        {/* Message Content */}
        {item.content ? (
          <View style={styles.messageSection}>
            <Text style={styles.messageSectionLabel}>{t('report.myReports.reportedMessage')}</Text>
            <View style={styles.messageContentBox}>
              <Icon name="chatbox-ellipses-outline" size={14} color={colors.textMedium} style={{ marginTop: 2 }} />
              <Text style={styles.messageContentText} numberOfLines={3}>
                {item.content.message}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.warningBox}>
            <Icon name="information-circle-outline" size={16} color="#FF9800" />
            <Text style={styles.warningText}>
              {t('report.myReports.messageUnavailable')}
            </Text>
          </View>
        )}

        {/* Resolution */}
        {item.resolution && (
          <View style={styles.resolutionSection}>
            <View style={styles.resolutionHeader}>
              <Icon name="document-text-outline" size={14} color="#4CAF50" />
              <Text style={styles.resolutionHeaderText}>{t('report.myReports.resolution')}</Text>
            </View>
            <Text style={styles.resolutionText}>{item.resolution}</Text>
          </View>
        )}

        {/* Footer Date */}
        <View style={styles.reportFooter}>
          <Icon name="calendar-outline" size={12} color={colors.textLabel} />
          <Text style={styles.footerDate}>{formatDate(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => {
    const emptyKey = selectedFilter === 'all' ? 'all' : selectedFilter === 'resolved' ? 'resolved' : 'pending';

    return (
      <View style={styles.emptyContainer}>
        <Icon name="document-text-outline" size={80} color={colors.textLabel} />
        <Text style={styles.emptyTitle}>{t(`report.myReports.empty.${emptyKey}.title`)}</Text>
        <Text style={styles.emptyText}>{t(`report.myReports.empty.${emptyKey}.message`)}</Text>
      </View>
    );
  };

  // Calculate counts
  const resolvedCount = reports.filter((r) => r.status?.toLowerCase() === "resolved").length;
  const pendingCount = reports.filter((r) => r.status?.toLowerCase() === "pending").length;

  // Filter reports based on selected filter
  const filteredReports = reports.filter((r) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'resolved') return r.status?.toLowerCase() === 'resolved';
    if (selectedFilter === 'pending') return r.status?.toLowerCase() === 'pending';
    return true;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradients.background} style={styles.gradient}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" size={24} color={colors.textDark} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{t('report.myReports.title')}</Text>
            <View style={{ width: 40 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>{t('report.myReports.loading')}</Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
          <Text style={styles.headerTitle}>{t('report.myReports.title')}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Stats - Filterable */}
        {reports.length > 0 && (
          <View style={styles.statsContainer}>
            {/* Total */}
            <TouchableOpacity
              style={[
                styles.statCard,
                selectedFilter === 'all' && styles.statCardActive,
              ]}
              onPress={() => setSelectedFilter('all')}
              activeOpacity={0.7}
            >
              <Icon name="flag" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{reports.length}</Text>
              <Text style={styles.statLabel}>{t('report.myReports.stats.total')}</Text>
            </TouchableOpacity>

            {/* Resolved */}
            <TouchableOpacity
              style={[
                styles.statCard,
                selectedFilter === 'resolved' && styles.statCardActive,
              ]}
              onPress={() => setSelectedFilter('resolved')}
              activeOpacity={0.7}
            >
              <Icon name="checkmark-circle" size={24} color="#4CAF50" />
              <Text style={styles.statNumber}>{resolvedCount}</Text>
              <Text style={styles.statLabel}>{t('report.myReports.stats.resolved')}</Text>
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
              <Icon name="time" size={24} color="#FF9800" />
              <Text style={styles.statNumber}>{pendingCount}</Text>
              <Text style={styles.statLabel}>{t('report.myReports.stats.pending')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Filter Info */}
        {reports.length > 0 && (
          <View style={styles.filterInfo}>
            <Text style={styles.filterInfoText}>
              {selectedFilter === 'all'
                ? t('report.myReports.filter.showAll', { count: filteredReports.length })
                : selectedFilter === 'resolved'
                  ? t('report.myReports.filter.showResolved', { count: filteredReports.length })
                  : t('report.myReports.filter.showPending', { count: filteredReports.length })}
            </Text>
          </View>
        )}

        {/* Reports List */}
        <FlatList
          data={filteredReports}
          renderItem={renderReport}
          keyExtractor={(item) => item.reportId.toString()}
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

  // Filter Info
  filterInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  filterInfoText: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: "600",
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
    padding: 14,
    marginBottom: 12,
    ...shadows.medium,
  },

  // Report ID Row
  reportIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reportIdLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reportTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: colors.textDark,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 10,
  },

  // Info Rows
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: "500",
    minWidth: 130,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    fontWeight: "600",
  },

  // Warning Box
  warningBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF8E1",
    borderRadius: radius.sm,
    padding: 10,
    marginBottom: 10,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: colors.textDark,
    lineHeight: 16,
  },

  // Message Section
  messageSection: {
    marginTop: 4,
    marginBottom: 8,
  },
  messageSectionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMedium,
    marginBottom: 6,
  },
  messageContentBox: {
    backgroundColor: "#FFF3F3",
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    borderRadius: radius.sm,
    padding: 10,
    flexDirection: "row",
    gap: 8,
  },
  messageContentText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },

  // Resolution Section
  resolutionSection: {
    backgroundColor: "#F1F8E9",
    borderRadius: radius.sm,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  resolutionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  resolutionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  resolutionText: {
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },

  // Footer
  reportFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerDate: {
    fontSize: 11,
    color: colors.textLabel,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
    marginTop: 12,
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

