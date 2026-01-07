import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, radius, shadows } from '../theme';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface LimitReachedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionType?: 'match' | 'ai_chat' | 'expert_confirm' | 'expert_chat';
  isVip?: boolean;
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = React.memo(({
  visible,
  onClose,
  title,
  message,
  actionType = 'match',
  isVip = false,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const featureIcon = useMemo(() => {
    switch (actionType) {
      case 'match':
        return 'heart-outline';
      case 'ai_chat':
        return 'chatbubbles-outline';
      case 'expert_confirm':
        return 'people-outline';
      case 'expert_chat':
        return 'chatbubble-ellipses-outline';

      default:
        return 'timer-outline';
    }
  }, [actionType]);

  const featureTitle = useMemo(() => {
    const titleKey = `limitModal.titles.${actionType}`;
    const translatedTitle = t(titleKey);
    // If translation exists for this action type, use it; otherwise use custom title or default
    if (translatedTitle !== titleKey) {
      return translatedTitle;
    }
    return title || t('limitModal.defaultTitle');
  }, [actionType, title, t]);

  // Get the display message
  const displayMessage = useMemo(() => {
    return message || t('limitModal.defaultMessage');
  }, [message, t]);

  const handleUpgrade = useCallback(() => {
    onClose();
    navigation.navigate('Settings');
  }, [onClose, navigation]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#FF6B9D', '#C44569']}
            style={styles.gradient}
          >
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Icon name={featureIcon} size={64} color={colors.white} />
            </View>

            {/* Title */}
            <Text style={styles.title}>{featureTitle}</Text>

            {/* Message */}
            <Text style={styles.message}>{displayMessage}</Text>

            {isVip ? (
              /* VIP User - Show wait message */
              <View style={styles.vipWaitBox}>
                <Icon name="time-outline" size={32} color="#FFD700" />
                <Text style={styles.vipWaitText}>{t('limitModal.vipWaitMessage')}</Text>
              </View>
            ) : (
              <>
                {/* Premium Features - Only show for non-VIP users */}
                <View style={styles.featuresBox}>
                  <View style={styles.featureRow}>
                    <Icon name="infinite" size={24} color="#FFD700" />
                    <Text style={styles.featureText}>{t('limitModal.features.unlimitedLikes')}</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Icon name="chatbubbles" size={24} color="#FFD700" />
                    <Text style={styles.featureText}>{t('limitModal.features.unlimitedAI')}</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Icon name="people" size={24} color="#FFD700" />
                    <Text style={styles.featureText}>{t('limitModal.features.unlimitedExpert')}</Text>
                  </View>
                  <View style={styles.featureRow}>
                    <Icon name="star" size={24} color="#FFD700" />
                    <Text style={styles.featureText}>{t('limitModal.features.vipBadge')}</Text>
                  </View>
                </View>

                {/* Upgrade Button - Only show for non-VIP users */}
                <TouchableOpacity
                  style={styles.upgradeButton}
                  onPress={handleUpgrade}
                >
                  <LinearGradient
                    colors={['#FFD700', '#FFA500']}
                    style={styles.upgradeButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Icon name="diamond" size={20} color="#000" />
                    <Text style={styles.upgradeButtonText}>{t('limitModal.upgradePremium')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>{t('limitModal.later')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 48,
    maxWidth: 400,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  gradient: {
    padding: 32,
    alignItems: 'center',
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.white,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
    opacity: 0.95,
  },
  featuresBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.lg,
    padding: 20,
    width: '100%',
    marginBottom: 24,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: colors.white,
    fontWeight: '600',
  },
  upgradeButton: {
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 12,
    ...shadows.medium,
  },
  upgradeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    paddingVertical: 12,
  },
  closeText: {
    fontSize: 16,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
  },
  vipWaitBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: radius.lg,
    padding: 24,
    width: '100%',
    marginBottom: 24,
    alignItems: 'center',
    gap: 12,
  },
  vipWaitText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
  },
});
