import React, { useState, useCallback } from 'react';
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
import { PolicyCard } from '../components';
import { PendingPolicy, acceptAllPolicies, PolicyAcceptRequest } from '../api/policyApi';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'PolicyAcceptance'>;

const PolicyAcceptanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { pendingPolicies, fromRegistration } = route.params;
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const [checkedPolicies, setCheckedPolicies] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  const allPoliciesChecked = pendingPolicies.every(
    (policy) => checkedPolicies[policy.policyCode]
  );

  const handleCheckChange = useCallback((policyCode: string, checked: boolean) => {
    setCheckedPolicies((prev) => ({
      ...prev,
      [policyCode]: checked,
    }));
  }, []);

  const handleAcceptAll = async () => {
    if (!allPoliciesChecked) {
      showAlert({
        type: 'warning',
        title: t('policy.acceptance.incompleteTitle'),
        message: t('policy.acceptance.incompleteMessage'),
      });
      return;
    }

    setLoading(true);
    try {
      const requests: PolicyAcceptRequest[] = pendingPolicies.map((policy) => ({
        policyCode: policy.policyCode,
        versionNumber: policy.versionNumber,
      }));

      await acceptAllPolicies(requests);

      // Navigate to Home after successful acceptance
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: t('policy.acceptance.errorTitle'),
        message: error.message || t('policy.acceptance.errorMessage'),
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="document-text" size={32} color={colors.primary} />
        </View>
        <Text style={styles.headerTitle}>{t('policy.acceptance.title')}</Text>
        <Text style={styles.headerSubtitle}>{t('policy.acceptance.subtitle')}</Text>
      </View>

      {/* Policy List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pendingPolicies.map((policy: PendingPolicy) => (
          <PolicyCard
            key={policy.policyCode}
            policy={policy}
            showCheckbox={true}
            checked={checkedPolicies[policy.policyCode] || false}
            onCheckChange={(checked) => handleCheckChange(policy.policyCode, checked)}
            initialExpanded={pendingPolicies.length === 1}
          />
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Icon name="information-circle" size={20} color={colors.primary} />
          <Text style={styles.infoText}>{t('policy.acceptance.infoText')}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.acceptButton,
            !allPoliciesChecked && styles.acceptButtonDisabled,
          ]}
          onPress={handleAcceptAll}
          disabled={loading || !allPoliciesChecked}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={allPoliciesChecked ? gradients.primary : [colors.border, colors.border]}
            style={styles.acceptButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Icon
                  name="checkmark-circle"
                  size={22}
                  color={allPoliciesChecked ? colors.white : colors.textLight}
                />
                <Text
                  style={[
                    styles.acceptButtonText,
                    !allPoliciesChecked && styles.acceptButtonTextDisabled,
                  ]}
                >
                  {t('policy.acceptance.acceptAll')}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.policyCount}>
          {t('policy.acceptance.checkedCount', {
            checked: Object.values(checkedPolicies).filter(Boolean).length,
            total: pendingPolicies.length,
          })}
        </Text>
      </View>

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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: spacing.xl,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textMedium,
    lineHeight: 18,
  },
  bottomContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  acceptButton: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.button,
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  acceptButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  acceptButtonTextDisabled: {
    color: colors.textLight,
  },
  policyCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default PolicyAcceptanceScreen;
