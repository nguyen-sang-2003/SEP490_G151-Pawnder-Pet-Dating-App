import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography, shadows, gradients } from '../theme';
import { PendingPolicy } from '../features/policy/api/policyApi';
import PolicyCard from '../features/policy/components/PolicyCard';

interface PolicyRequiredModalProps {
  visible: boolean;
  pendingPolicies: PendingPolicy[];
  onAcceptAll: () => void;
  onClose?: () => void;
  loading?: boolean;
}

const PolicyRequiredModal: React.FC<PolicyRequiredModalProps> = ({
  visible,
  pendingPolicies,
  onAcceptAll,
  onClose,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [checkedPolicies, setCheckedPolicies] = useState<Set<string>>(new Set());
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Reset checked state when modal opens with new policies
  useEffect(() => {
    if (visible) {
      setCheckedPolicies(new Set());
    }
  }, [visible, pendingPolicies]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleCheckChange = useCallback((policyCode: string, checked: boolean) => {
    setCheckedPolicies(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(policyCode);
      } else {
        newSet.delete(policyCode);
      }
      return newSet;
    });
  }, []);

  const allPoliciesChecked = pendingPolicies.length > 0 && 
    pendingPolicies.every(p => checkedPolicies.has(p.policyCode));

  const handleAcceptAll = () => {
    if (allPoliciesChecked && !loading) {
      onAcceptAll();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={() => {
        // Cannot dismiss without accepting - do nothing
      }}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
        <Animated.View
          style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Icon name="policy" size={32} color={colors.primary} />
            </View>
            <Text style={styles.title}>
              {t('policy.requiredTitle', 'Chính sách cần xác nhận')}
            </Text>
            <Text style={styles.subtitle}>
              {t('policy.requiredSubtitle', 'Vui lòng đọc và xác nhận các chính sách sau để tiếp tục sử dụng ứng dụng')}
            </Text>
          </View>

          {/* Policy List */}
          <ScrollView 
            style={styles.policyList}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.policyListContent}
          >
            {pendingPolicies && pendingPolicies.length > 0 ? (
              pendingPolicies.map((policy) => (
                <PolicyCard
                  key={policy.policyCode}
                  policy={policy}
                  showCheckbox={true}
                  checked={checkedPolicies.has(policy.policyCode)}
                  onCheckChange={(checked) => handleCheckChange(policy.policyCode, checked)}
                />
              ))
            ) : null}
          </ScrollView>

          {/* Accept Button */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleAcceptAll}
              disabled={!allPoliciesChecked || loading}
              style={styles.buttonWrapper}
            >
              <LinearGradient
                colors={allPoliciesChecked ? gradients.primary : ['#CCC', '#BBB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.acceptButton,
                  (!allPoliciesChecked || loading) && styles.buttonDisabled,
                ]}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <>
                    <Icon name="check-circle" size={20} color={colors.white} />
                    <Text style={styles.buttonText}>
                      {t('policy.acceptAll', 'Xác nhận tất cả')}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
            
            {!allPoliciesChecked && (
              <Text style={styles.hintText}>
                {t('policy.checkAllHint', 'Vui lòng đánh dấu xác nhận tất cả chính sách')}
              </Text>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    width: '100%',
    maxHeight: '90%',
    ...shadows.large,
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryPastel,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textMedium,
    textAlign: 'center',
    lineHeight: 20,
  },
  policyList: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: 350,
    minHeight: 100,
  },
  policyListContent: {
    padding: spacing.lg,
  },
  buttonContainer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: radius.xl,
    ...shadows.button,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xxl,
    borderRadius: radius.xl,
    gap: spacing.sm,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  hintText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});

export default PolicyRequiredModal;
