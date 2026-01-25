import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SubmissionResponse } from '../../../types/event.types';
import { colors, radius, shadows, typography, gradients } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

interface WinnersSectionProps {
  winners: SubmissionResponse[];
  onWinnerPress: (submission: SubmissionResponse) => void;
}

const RANK_BADGES = ['🥇', '🥈', '🥉'];
const RANK_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

/**
 * WinnersSection Component
 * Displays Top 3 winners with rank badges (🥇, 🥈, 🥉)
 */
const WinnersSection: React.FC<WinnersSectionProps> = ({
  winners,
  onWinnerPress,
}) => {
  if (!winners || winners.length === 0) {
    return null;
  }

  const renderWinnerCard = (winner: SubmissionResponse, index: number) => {
    const rank = index + 1;
    const isFirst = rank === 1;

    return (
      <TouchableOpacity
        key={winner.submissionId}
        style={[styles.winnerCard, isFirst && styles.firstPlaceCard]}
        onPress={() => onWinnerPress(winner)}
        activeOpacity={0.8}
      >
        {/* Rank Badge */}
        <View
          style={[
            styles.rankBadge,
            { backgroundColor: RANK_COLORS[index] || RANK_COLORS[2] },
          ]}
        >
          <Text style={styles.rankEmoji}>{RANK_BADGES[index] || '🏆'}</Text>
        </View>

        {/* Pet Image */}
        <View style={[styles.imageWrapper, isFirst && styles.firstPlaceImage]}>
          <OptimizedImage
            source={{ uri: winner.thumbnailUrl || winner.mediaUrl || '' }}
            style={styles.winnerImage}
            imageSize="thumbnail"
          />
        </View>

        {/* Info */}
        <Text style={styles.petName} numberOfLines={1}>
          {winner.petName || 'Pet'}
        </Text>
        <View style={styles.voteRow}>
          <Text style={styles.voteCount}>❤️ {winner.voteCount}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Reorder to show 2nd, 1st, 3rd for podium effect
  const orderedWinners = [...winners].slice(0, 3);
  const podiumOrder =
    orderedWinners.length >= 3
      ? [orderedWinners[1], orderedWinners[0], orderedWinners[2]]
      : orderedWinners;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF8E1', '#FFECB3']}
        style={styles.headerGradient}
      >
        <Text style={styles.title}>🏆 Người thắng cuộc</Text>
      </LinearGradient>

      <View style={styles.winnersRow}>
        {podiumOrder.map((winner, displayIndex) => {
          // Map back to original index for correct rank
          const originalIndex = orderedWinners.indexOf(winner);
          return renderWinnerCard(winner, originalIndex);
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  headerGradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    textAlign: 'center',
  },
  winnersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 12,
    gap: 12,
  },
  winnerCard: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.md,
    maxWidth: 110,
  },
  firstPlaceCard: {
    transform: [{ translateY: -10 }],
    backgroundColor: '#FFFDE7',
  },
  rankBadge: {
    position: 'absolute',
    top: -10,
    zIndex: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  rankEmoji: {
    fontSize: 16,
  },
  imageWrapper: {
    width: 70,
    height: 70,
    borderRadius: 35,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  firstPlaceImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  winnerImage: {
    width: '100%',
    height: '100%',
  },
  petName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
    marginTop: 8,
    textAlign: 'center',
  },
  ownerName: {
    fontSize: typography.fontSize.xs,
    color: colors.textMedium,
    marginTop: 2,
    textAlign: 'center',
  },
  voteRow: {
    marginTop: 6,
  },
  voteCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
});

export default WinnersSection;
