import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';
import { PolicyContent } from '../components';
import { ActivePolicy, getActivePolicyByCode } from '../api/policyApi';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyDetail'>;

const PolicyDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { policyCode, policyName } = route.params;

  const [policy, setPolicy] = useState<ActivePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPolicy = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActivePolicyByCode(policyCode);
      setPolicy(data);
    } catch (err: any) {
      setError(err.message || t('policy.detail.loadError'));
    } finally {
      setLoading(false);
    }
  }, [policyCode, t]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const renderLoading = () => (
    <View style={styles.centerContainer}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.loadingText}>{t('common.loading')}</Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.centerContainer}>
      <Icon name="alert-circle-outline" size={64} color={colors.error} />
      <Text style={styles.errorTitle}>{t('policy.detail.errorTitle')}</Text>
      <Text style={styles.errorMessage}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchPolicy}>
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          {policyName}
        </Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      {loading ? (
        renderLoading()
      ) : error ? (
        renderError()
      ) : policy ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Policy Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Icon name="document-text-outline" size={20} color={colors.primary} />
                <Text style={styles.infoLabel}>{t('policy.detail.version')}</Text>
                <Text style={styles.infoValue}>{policy.versionNumber}</Text>
              </View>
              {policy.publishedAt && (
                <View style={styles.infoItem}>
                  <Icon name="calendar-outline" size={20} color={colors.primary} />
                  <Text style={styles.infoLabel}>{t('policy.detail.publishedDate')}</Text>
                  <Text style={styles.infoValue}>{formatDate(policy.publishedAt)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Policy Title */}
          {policy.title && (
            <Text style={styles.policyTitle}>{policy.title}</Text>
          )}

          {/* Policy Content */}
          <View style={styles.contentCard}>
            <PolicyContent content={policy.content} scrollable={false} />
          </View>
        </ScrollView>
      ) : null}
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
    flex: 1,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  infoCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginTop: spacing.xs,
  },
  policyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  contentCard: {
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  // Center container for loading/error states
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  loadingText: {
    fontSize: typography.fontSize.md,
    color: colors.textMedium,
    marginTop: spacing.md,
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

export default PolicyDetailScreen;
