import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { colors, radius, shadows, gradients } from '../theme';
import { useTranslation } from 'react-i18next';
import { MatchedAttribute } from '../features/pet/api/petApi';

const { width } = Dimensions.get('window');

interface MatchDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  petName: string;
  matchPercent: number;
  matchScore?: number;
  totalPercent?: number;
  matchedAttributes: MatchedAttribute[];
  totalFilters: number; // Tổng số filter user đã đặt
}

export const MatchDetailsModal: React.FC<MatchDetailsModalProps> = React.memo(({
  visible,
  onClose,
  petName,
  matchPercent,
  matchedAttributes,
  totalFilters,
}) => {
  const { t } = useTranslation();

  const matchedCount = matchedAttributes?.length || 0;
  const hasAttributes = matchedCount > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header with Big Percentage */}
          <LinearGradient
            colors={gradients.home}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Pet Name */}
            <View style={styles.petNameRow}>
              <Icon name="star" size={20} color="#FFD700" />
              <Text style={styles.petName}>{petName}</Text>
            </View>

            {/* Big Match Percentage */}
            <Text style={styles.bigPercent}>{matchPercent}%</Text>
            <Text style={styles.matchLabel}>{t('matchDetails.matchWithYou')}</Text>

            {/* Filter Count Badge */}
            {totalFilters > 0 && (
              <View style={styles.filterCountBadge}>
                <Icon name="checkmark-circle" size={16} color="#4CAF50" />
                <Text style={styles.filterCountText}>
                  {t('matchDetails.filterCount', { matched: matchedCount, total: totalFilters })}
                </Text>
              </View>
            )}
          </LinearGradient>

          {/* Content - Matched Filters */}
          <View style={styles.content}>
            {hasAttributes ? (
              <>
                <Text style={styles.sectionTitle}>{t('matchDetails.matchedFilters')}</Text>
                
                <ScrollView 
                  style={styles.scrollList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                >
                  {matchedAttributes.map((attr, index) => (
                    <View key={attr.attributeId || index} style={styles.filterRow}>
                      <View style={styles.checkCircle}>
                        <Icon name="checkmark" size={12} color="#fff" />
                      </View>
                      <View style={styles.filterInfo}>
                        <Text style={styles.filterName}>{attr.attributeName}</Text>
                        <Text style={styles.filterValue}>
                          {attr.petOptionName || attr.petValue}
                        </Text>
                      </View>
                    </View>
                  ))}
                </ScrollView>

                {/* Info hint */}
                <View style={styles.infoHint}>
                  <Icon name="information-circle-outline" size={16} color={colors.textLight} />
                  <Text style={styles.infoHintText}>{t('matchDetails.infoHint')}</Text>
                </View>
              </>
            ) : (
              <View style={styles.emptyState}>
                <Icon name="filter-outline" size={40} color={colors.textLight} />
                <Text style={styles.emptyTitle}>{t('matchDetails.noPreferences')}</Text>
                <Text style={styles.emptyMessage}>{t('matchDetails.noPreferencesDesc')}</Text>
              </View>
            )}
          </View>

          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeButtonText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width - 48,
    maxWidth: 360,
    maxHeight: '80%',
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.white,
    ...shadows.large,
  },
  
  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  petNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  petName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  bigPercent: {
    fontSize: 56,
    fontWeight: 'bold',
    color: colors.white,
    lineHeight: 64,
  },
  matchLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  filterCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    gap: 6,
  },
  filterCountText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },

  // Content
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMedium,
    marginBottom: 12,
  },
  scrollList: {
    maxHeight: 200,
  },
  listContent: {
    gap: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterInfo: {
    flex: 1,
  },
  filterName: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textDark,
  },
  filterValue: {
    fontSize: 13,
    color: '#4CAF50',
    marginTop: 2,
    fontWeight: '500',
  },

  // Info Hint
  infoHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    marginTop: 16,
    gap: 8,
  },
  infoHintText: {
    fontSize: 12,
    color: colors.textLight,
    flex: 1,
    lineHeight: 16,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },

  // Close Button
  closeButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default MatchDetailsModal;
