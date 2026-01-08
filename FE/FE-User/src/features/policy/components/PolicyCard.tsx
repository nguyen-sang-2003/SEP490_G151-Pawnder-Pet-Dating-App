import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, radius, spacing, typography, shadows } from '../../../theme';
import { PendingPolicy, ActivePolicy } from '../api/policyApi';
import PolicyContent from './PolicyContent';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PolicyCardProps {
  policy: PendingPolicy | ActivePolicy;
  showCheckbox?: boolean;
  checked?: boolean;
  onCheckChange?: (checked: boolean) => void;
  initialExpanded?: boolean;
}

const PolicyCard: React.FC<PolicyCardProps> = ({
  policy,
  showCheckbox = false,
  checked = false,
  onCheckChange,
  initialExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const rotateAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    Animated.timing(rotateAnim, {
      toValue: expanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    setExpanded(!expanded);
  };

  const handleCheckboxPress = () => {
    onCheckChange?.(!checked);
  };

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const isPendingPolicy = (p: PendingPolicy | ActivePolicy): p is PendingPolicy => {
    return 'hasPreviousAccept' in p;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          {showCheckbox && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={handleCheckboxPress}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked && (
                  <Icon name="check" size={16} color={colors.white} />
                )}
              </View>
            </TouchableOpacity>
          )}
          <View style={styles.titleContainer}>
            <Text style={styles.policyName} numberOfLines={2}>
              {policy.policyName}
            </Text>
            <Text style={styles.versionText}>
              Phiên bản {policy.versionNumber}
              {isPendingPolicy(policy) && policy.hasPreviousAccept && (
                <Text style={styles.updateBadge}> • Cập nhật mới</Text>
              )}
            </Text>
          </View>
        </View>
        
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <Icon name="expand-more" size={24} color={colors.textMedium} />
        </Animated.View>
      </TouchableOpacity>

      {/* Expandable Content */}
      {expanded && (
        <View style={styles.contentContainer}>
          <PolicyContent content={policy.content} />
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    ...shadows.medium,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkboxContainer: {
    marginRight: spacing.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  titleContainer: {
    flex: 1,
  },
  policyName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textLight,
  },
  updateBadge: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default PolicyCard;
