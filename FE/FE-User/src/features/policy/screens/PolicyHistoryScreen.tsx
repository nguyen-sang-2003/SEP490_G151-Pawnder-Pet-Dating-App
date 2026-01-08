import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';
import { PolicyAcceptHistory, getPolicyHistory } from '../api/policyApi';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyHistory'>;

// Skeleton component for loading state
const HistoryItemSkeleton: React.FC = () => (
  <View style={styles.skeletonItem}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
      <View style={styles.skeletonMeta} />
    </View>
  </View>
);

const PolicyHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [history, setHistory] = useState<PolicyAcceptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getPolicyHistory();
      setHistory(data);
    } catch (err: any) {
      setError(err.message || t('policy.history.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleRefresh = useCallback(() => {
    fetchHistory(true);
  }, [fetchHistory]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderHistoryItem = useCallback(({ item }: { item: PolicyAcceptHistory }) => {
    const isValid = item.isValid;

    return (
      <View style={[styles.historyItem, !isValid && styles.historyItemInvalid]}>
        {/* Status Icon */}
        <View style={[styles.statusIcon, isValid ? styles.statusIconValid : styles.statusIconInvalid]}>
          <Icon
            name={isValid ? 'checkmark-circle' : 'close-circle'}
            size={24}
            color={isValid ? colors.success : colors.error}
          />
        </View>

        {/* Content */}
        <View style={styles.historyContent}>
          <Text style={styles.policyName} numberOfLines={2}>
            {item.policyName}
          </Text>
          <Text style={styles.versionTitle} numberOfLines={1}>
            {item.versionTitle}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="document-text-outline" size={14} color={colors.textLight} />
              <Text style={styles.metaText}>
                {t('policy.history.version', { version: item.versionNumber })}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="calendar-outline" size={14} color={colors.textLight} />
              <Text style={styles.metaText}>{formatDate(item.acceptedAt)}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View style={[styles.statusBadge, isValid ? styles.statusBadgeValid : styles.statusBadgeInvalid]}>
            <Text style={[styles.statusText, isValid ? styles.statusTextValid : styles.statusTextInvalid]}>
              {isValid ? t('policy.history.valid') : t('policy.history.invalidated')}
            </Text>
          </View>

          {/* Invalidation Info */}
          {!isValid && item.invalidatedAt && (
            <View style={styles.invalidationInfo}>
              <Icon name="information-circle-outline" size={14} color={colors.error} />
              <Text style={styles.invalidationText}>
                {t('policy.history.invalidatedAt', { date: formatDate(item.invalidatedAt) })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  }, [t]);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((key) => (
        <HistoryItemSkeleton key={key} />
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="time-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>{t('policy.history.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('policy.history.emptySubtitle')}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>{t('policy.history.errorTitle')}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchHistory()}>
        <Text style={styles.retryButtonText}>{t('common.retry')}</Text>
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
        <Text style={styles.headerTitle}>{t('policy.history.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={history}
          renderItem={renderHistoryItem}
          keyExtractor={(item) => item.acceptId.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
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
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 50,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.whiteWarm,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
  },
  placeholder: {
    width: 40,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  historyItem: {
    flexDirection: 'row',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  historyItemInvalid: {
    backgroundColor: `${colors.error}08`,
    borderWidth: 1,
    borderColor: `${colors.error}20`,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  statusIconValid: {
    backgroundColor: `${colors.success}15`,
  },
  statusIconInvalid: {
    backgroundColor: `${colors.error}15`,
  },
  historyContent: {
    flex: 1,
  },
  policyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  versionTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textMedium,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  statusBadgeValid: {
    backgroundColor: `${colors.success}15`,
  },
  statusBadgeInvalid: {
    backgroundColor: `${colors.error}15`,
  },
  statusText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  statusTextValid: {
    color: colors.success,
  },
  statusTextInvalid: {
    color: colors.error,
  },
  invalidationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  invalidationText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    marginRight: spacing.md,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonTitle: {
    width: '70%',
    height: 18,
    backgroundColor: colors.border,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
  },
  skeletonSubtitle: {
    width: '50%',
    height: 14,
    backgroundColor: colors.border,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
  },
  skeletonMeta: {
    width: '80%',
    height: 14,
    backgroundColor: colors.border,
    borderRadius: radius.xs,
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textMedium,
    textAlign: 'center',
  },
  // Error state
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    fontSize: typography.fontSize.md,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  retryButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default PolicyHistoryScreen;
