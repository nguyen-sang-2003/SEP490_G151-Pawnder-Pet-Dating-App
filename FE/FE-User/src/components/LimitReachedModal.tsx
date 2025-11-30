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

const { width } = Dimensions.get('window');

interface LimitReachedModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  actionType?: 'match' | 'ai_chat' | 'expert_confirm' | 'filter';
}

// 🚀 OPTIMIZATION: Memoize LimitReachedModal to prevent unnecessary re-renders
export const LimitReachedModal: React.FC<LimitReachedModalProps> = React.memo(({
  visible,
  onClose,
  title = 'Ối! Hết giới hạn',
  message = 'Bạn đã hết lượt sử dụng hôm nay!',
  actionType = 'match',
}) => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🚀 OPTIMIZATION: Memoize feature icon calculation
  const featureIcon = useMemo(() => {
    switch (actionType) {
      case 'match':
        return 'heart-outline';
      case 'ai_chat':
        return 'chatbubbles-outline';
      case 'expert_confirm':
        return 'people-outline';
      case 'filter':
        return 'funnel-outline';
      default:
        return 'timer-outline';
    }
  }, [actionType]);

  // 🚀 OPTIMIZATION: Memoize feature title calculation
  const featureTitle = useMemo(() => {
    switch (actionType) {
      case 'match':
        return 'Ối! Hết lượt thích';
      case 'ai_chat':
        return 'Ối! Hết câu hỏi AI';
      case 'expert_confirm':
        return 'Ối! Hết lượt xác nhận chuyên gia';
      case 'filter':
        return 'Ối! Hết lượt tìm kiếm bộ lọc';
      default:
        return title;
    }
  }, [actionType, title]);

  // 🚀 OPTIMIZATION: Memoize handleUpgrade with useCallback
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
            <Text style={styles.message}>{message}</Text>

            {/* Premium Features */}
            <View style={styles.featuresBox}>
              <View style={styles.featureRow}>
                <Icon name="infinite" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Lượt thích không giới hạn</Text>
              </View>
              <View style={styles.featureRow}>
                <Icon name="chatbubbles" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Chat AI không giới hạn</Text>
              </View>
              <View style={styles.featureRow}>
                <Icon name="people" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Xác nhận chuyên gia không giới hạn</Text>
              </View>
              <View style={styles.featureRow}>
                <Icon name="star" size={24} color="#FFD700" />
                <Text style={styles.featureText}>Huy hiệu VIP & ưu tiên</Text>
              </View>
            </View>

            {/* Upgrade Button */}
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
                <Text style={styles.upgradeButtonText}>Nâng cấp Premium</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Để sau</Text>
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
});

