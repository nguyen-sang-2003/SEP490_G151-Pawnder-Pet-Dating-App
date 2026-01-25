import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
// @ts-ignore
import Icon from "react-native-vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { RootStackParamList } from "../../../navigation/AppNavigator";
import { colors, gradients, radius, shadows } from "../../../theme";
import { getBlockedUsers, unblockUser } from "../api/blockApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomAlert from "../../../components/CustomAlert";
import { useCustomAlert } from "../../../hooks/useCustomAlert";

type Props = NativeStackScreenProps<RootStackParamList, "BlockedUsers">;

interface BlockedUser {
  toUserId: number;
  toUserFullName: string;
  toUserEmail: string;
  createdAt: string;
}

const BlockedUsersScreen = ({ navigation }: Props) => {
  const { t } = useTranslation();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  // Load blocked users when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      loadBlockedUsers();
    }, [])
  );

  const loadBlockedUsers = async () => {
    try {
      setLoading(true);
      const currentUserIdStr = await AsyncStorage.getItem('userId');
      if (!currentUserIdStr) {
        showAlert({ type: 'error', title: t('alerts.error'), message: t('report.blocked.errors.userNotFound') });
        return;
      }
      const currentUserId = parseInt(currentUserIdStr, 10);

      const users = await getBlockedUsers(currentUserId);
      setBlockedUsers(users);
    } catch (error: any) {

      showAlert({ type: 'error', title: t('alerts.error'), message: t('report.blocked.errors.loadFailed') });
    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (toUserId: number, userName: string) => {
    try {
      const currentUserIdStr = await AsyncStorage.getItem('userId');
      if (!currentUserIdStr) {
        showAlert({ type: 'error', title: t('alerts.error'), message: t('report.blocked.errors.userNotFound') });
        return;
      }
      const currentUserId = parseInt(currentUserIdStr, 10);

      showAlert({
        type: 'warning',
        title: t('report.blocked.unblockTitle'),
        message: t('report.blocked.unblockConfirm', { name: userName }),
        showCancel: true,
        confirmText: t('report.blocked.unblock'),
        onConfirm: async () => {
          try {
            await unblockUser(currentUserId, toUserId);

            // Remove from list
            setBlockedUsers((prev) =>
              prev.filter((user) => user.toUserId !== toUserId)
            );

            showAlert({ type: 'success', title: t('report.blocked.unblockSuccess'), message: t('report.blocked.unblockSuccessMessage', { name: userName }) });
          } catch (error: any) {

            showAlert({ type: 'error', title: t('alerts.error'), message: error.message || t('report.blocked.errors.unblockFailed') });
          }
        },
      });
    } catch (error) {

      showAlert({ type: 'error', title: t('alerts.error'), message: t('errors.unknown') });
    }
  };

  const formatDate = (dateString: string) => {
    // Backend sends UTC time without 'Z' suffix, need to add it for correct parsing
    let dateStr = dateString;
    if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
      dateStr = dateStr + 'Z';
    }
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return t('report.myReports.time.justNow');
    if (diffDays === 1) return t('report.myReports.time.yesterday');
    if (diffDays < 7) return t('report.myReports.time.daysAgo', { count: diffDays });
    if (diffDays < 30) return t('report.myReports.time.weeksAgo', { count: Math.floor(diffDays / 7) });
    return t('report.myReports.time.monthsAgo', { count: Math.floor(diffDays / 30) });
  };

  const renderBlockedUser = ({ item }: { item: BlockedUser }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.avatarPlaceholder}>
          <Icon name="person" size={24} color={colors.textMedium} />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{item.toUserFullName}</Text>
          <Text style={styles.blockedTime}>{t('report.blocked.blockedTime', { time: formatDate(item.createdAt) })}</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.toUserId, item.toUserFullName)}
      >
        <Text style={styles.unblockText}>{t('report.blocked.unblock')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Icon name="ban-outline" size={64} color={colors.textLabel} />
      </View>
      <Text style={styles.emptyTitle}>{t('report.blocked.empty.title')}</Text>
      <Text style={styles.emptyText}>
        {t('report.blocked.empty.message')}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={gradients.background}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('report.blocked.title')}</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>{t('report.blocked.loading')}</Text>
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
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('report.blocked.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Icon
          name="information-circle-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.infoText}>
          {t('report.blocked.infoBanner')}
        </Text>
      </View>

      {/* List */}
      <FlatList
        data={blockedUsers}
        keyExtractor={(item) => item.toUserId.toString()}
        renderItem={renderBlockedUser}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContent,
          blockedUsers.length === 0 && styles.listContentEmpty,
        ]}
        showsVerticalScrollIndicator={false}
      />

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
        />
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
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: `${colors.primary}15`,
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 14,
    borderRadius: radius.md,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 18,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadows.small,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: colors.cardBackgroundLight,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textDark,
    marginBottom: 4,
  },
  blockedTime: {
    fontSize: 13,
    color: colors.textMedium,
  },
  unblockButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.cardBackground,
  },
  unblockText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary,
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
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMedium,
  },
});

export default BlockedUsersScreen;

