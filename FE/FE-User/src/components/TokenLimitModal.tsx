import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, gradients, radius, shadows } from '../theme';

const { width } = Dimensions.get('window');

interface TokenLimitModalProps {
  visible: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  isVip: boolean;
  tokensUsed: number;
  dailyQuota: number;
  tokensRemaining?: number;
  estimatedTokens?: number;
}

export const TokenLimitModal: React.FC<TokenLimitModalProps> = ({
  visible,
  onClose,
  onUpgrade,
  isVip,
  tokensUsed,
  dailyQuota,
  tokensRemaining = 0,
  estimatedTokens = 0,
}) => {
  const isFullyUsed = tokensRemaining === 0;
  const needsMore = estimatedTokens > tokensRemaining;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header với gradient */}
          <LinearGradient
            colors={isVip ? ['#FFD700', '#FFA500'] : gradients.primary}
            style={styles.header}
          >
            <View style={styles.iconContainer}>
              <Icon 
                name={isVip ? "star" : "hourglass-outline"} 
                size={48} 
                color={colors.white} 
              />
            </View>
          </LinearGradient>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.title}>
              {isFullyUsed 
                ? (isVip ? 'Hết lượt chat VIP!' : 'Hết lượt chat miễn phí!')
                : 'Không đủ tokens!'}
            </Text>

            {/* Subtitle nếu còn tokens nhưng không đủ */}
            {!isFullyUsed && needsMore && (
              <Text style={styles.subtitle}>
                Câu hỏi này cần ~{estimatedTokens.toLocaleString()} tokens, nhưng bạn chỉ còn {tokensRemaining.toLocaleString()} tokens
              </Text>
            )}

            {/* Simple message */}
            <View style={simpleStyles.simpleMessageContainer}>
              <Text style={simpleStyles.simpleMessage}>
                Bạn đã sử dụng hết {dailyQuota.toLocaleString()} tokens {isVip ? 'VIP' : 'miễn phí'} ngày hôm nay
              </Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={isVip ? ['#FFD700', '#FFA500'] : gradients.primary}
                  style={[styles.progressFill, { width: `${Math.min((tokensUsed / dailyQuota) * 100, 100)}%` }]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.min(Math.round((tokensUsed / dailyQuota) * 100), 100)}% đã sử dụng
              </Text>
            </View>

            {/* Message */}
            {isVip ? (
              <View style={styles.messageContainer}>
                <Icon name="time-outline" size={20} color={colors.textMedium} />
                <Text style={styles.message}>
                  Bạn đã sử dụng hết {dailyQuota.toLocaleString()} tokens VIP hôm nay. Quota sẽ được làm mới vào 00:00 ngày mai.
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.messageContainer}>
                  <Icon name="information-circle-outline" size={20} color={colors.textMedium} />
                  <Text style={styles.message}>
                    Bạn đã sử dụng hết {dailyQuota.toLocaleString()} tokens miễn phí hôm nay!
                  </Text>
                </View>

                {/* VIP Benefits */}
                <View style={styles.vipSection}>
                  <View style={styles.vipHeader}>
                    <Icon name="star" size={24} color="#FFD700" />
                    <Text style={styles.vipTitle}>Nâng cấp VIP - 99,000đ/tháng</Text>
                  </View>

                  <View style={styles.benefitsList}>
                    <View style={styles.benefitItem}>
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.benefitText}>
                        <Text style={styles.benefitHighlight}>50,000 tokens/ngày</Text> (5x nhiều hơn)
                      </Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.benefitText}>Xem ai thích pet của bạn trước</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.benefitText}>Ưu tiên ghép đôi (Priority matching)</Text>
                    </View>
                    <View style={styles.benefitItem}>
                      <Icon name="checkmark-circle" size={20} color={colors.success} />
                      <Text style={styles.benefitText}>Không có quảng cáo</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            {!isVip && onUpgrade && (
              <TouchableOpacity
                style={styles.upgradeButton}
                onPress={onUpgrade}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#FFD700', '#FFA500']}
                  style={styles.upgradeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Icon name="star" size={20} color={colors.white} />
                  <Text style={styles.upgradeText}>Nâng cấp VIP ngay</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.closeButton, isVip && styles.closeButtonFull]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>
                {isVip ? 'Đã hiểu' : 'Để sau'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: width - 40,
    maxWidth: 400,
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  header: {
    paddingVertical: 40,
    alignItems: 'center',
    position: 'relative',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
  content: {
    padding: 24,
    maxHeight: 500,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textDark,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 16,
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.xl,
    padding: 20,
    marginBottom: 24,
    ...shadows.small,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textMedium,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    color: colors.textMedium,
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.whiteWarm,
    padding: 16,
    borderRadius: radius.lg,
    marginBottom: 20,
    gap: 12,
  },
  message: {
    flex: 1,
    fontSize: 14,
    color: colors.textMedium,
    lineHeight: 20,
  },
  vipSection: {
    backgroundColor: '#FFF9E6',
    borderRadius: radius.xl,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
    ...shadows.small,
  },
  vipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  vipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textDark,
    flex: 1,
  },
  benefitsList: {
    gap: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: colors.textDark,
    lineHeight: 20,
  },
  benefitHighlight: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  upgradeButton: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadows.large,
  },
  upgradeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  upgradeText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 0.3,
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.whiteWarm,
  },
  closeButtonFull: {
    backgroundColor: colors.primary,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMedium,
  },
});

// Add subtitle style if not exists
const additionalStyles = StyleSheet.create({
  subtitle: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});

// Additional styles for simple message
const simpleStyles = {
  simpleMessageContainer: {
    backgroundColor: '#FFF9F0',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  simpleMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center' as const,
    lineHeight: 24,
    fontWeight: '500' as const,
  },
};
