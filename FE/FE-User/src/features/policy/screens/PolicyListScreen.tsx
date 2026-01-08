import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';
import { ActivePolicy, getActivePolicies } from '../api/policyApi';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyList'>;

// Skeleton component for loading state
const PolicyItemSkeleton: React.FC = () => (
  <View style={styles.skeletonItem}>
    <View style={styles.skeletonIcon} />
    <View style={styles.skeletonContent}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonSubtitle} />
    </View>
  </View>
);

const PolicyListScreen: React.FC<Props> = ({ navigation }) => {
  const { t } = useTranslation();
  const [policies, setPolicies] = useState<ActivePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicies = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const data = await getActivePolicies();
      setPolicies(data);
    } catch (err: any) {
      setError(err.message || t('policy.list.loadError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const handleRefresh = useCallback(() => {
    fetchPolicies(true);
  }, [fetchPolicies]);

  const handlePolicyPress = useCallback((policy: ActivePolicy) => {
    navigation.navigate('PolicyDetail', {
      policyCode: policy.policyCode,
      policyName: policy.policyName,
    });
  }, [navigation]);

  const renderPolicyItem = useCallback(({ item }: { item: ActivePolicy }) => {
    const publishedDate = item.publishedAt
      ? new Date(item.publishedAt).toLocaleDateString('vi-VN')
      : '';

    return (
      <TouchableOpacity
        style={styles.policyItem}
        onPress={() => handlePolicyPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.policyIcon}>
          <Icon name="document-text-outline" size={24} color={colors.primary} />
        </View>
        <View style={styles.policyContent}>
          <Text style={styles.policyName} numberOfLines={2}>
            {item.policyName}
          </Text>
          <Text style={styles.policyMeta}>
            {t('policy.list.version', { version: item.versionNumber })}
            {publishedDate && ` • ${publishedDate}`}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textLight} />
      </TouchableOpacity>
    );
  }, [handlePolicyPress, t]);

  const renderSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {[1, 2, 3, 4].map((key) => (
        <PolicyItemSkeleton key={key} />
      ))}
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="document-outline" size={64} color={colors.textLight} />
      <Text style={styles.emptyTitle}>{t('policy.list.emptyTitle')}</Text>
      <Text style={styles.emptySubtitle}>{t('policy.list.emptySubtitle')}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Icon name="alert-circle-outline" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>{t('policy.list.errorTitle')}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={() => fetchPolicies()}>
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
        <Text style={styles.headerTitle}>{t('policy.list.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        renderSkeleton()
      ) : error ? (
        renderError()
      ) : (
        <FlatList
          data={policies}
          renderItem={renderPolicyItem}
          keyExtractor={(item) => item.policyCode}
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
  policyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
  },
  policyIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  policyContent: {
    flex: 1,
  },
  policyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  policyMeta: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  // Skeleton styles
  skeletonContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  skeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    width: '40%',
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

export default PolicyListScreen;
