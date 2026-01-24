import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { LeaderboardResponse } from '../../../types/event.types';
import { colors, radius, shadows, typography } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

interface LeaderboardItemProps {
  item: LeaderboardResponse;
  isCurrentUser: boolean;
  onPress: (item: LeaderboardResponse) => void;
}

const RANK_BADGES: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

/**
 * LeaderboardItem Component
 * Displays rank, thumbnail, pet name, owner name, vote count
 * Highlights current user's entry
 */
const LeaderboardItem: React.FC<LeaderboardItemProps> = ({
  item,
  isCurrentUser,
  onPress,
}) => {
  const { rank, submission } = item;
  const isTopThree = rank <= 3;

  const renderRank = () => {
    if (isTopThree && RANK_BADGES[rank]) {
      return <Text style={styles.rankEmoji}>{RANK_BADGES[rank]}</Text>;
    }
    return <Text style={styles.rankNumber}>{rank}</Text>;
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrentUser && styles.currentUserContainer,
        isTopThree && styles.topThreeContainer,
      ]}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {/* Rank */}
      <View style={[styles.rankContainer, isTopThree && styles.topThreeRank]}>
        {renderRank()}
      </View>

      {/* Thumbnail */}
      <View style={styles.thumbnailWrapper}>
        <OptimizedImage
          source={{ uri: submission.thumbnailUrl || submission.mediaUrl }}
          style={styles.thumbnail}
          imageSize="thumbnail"
        />
        {submission.mediaType === 'video' && (
          <View style={styles.videoIcon}>
            <Icon name="play" size={10} color={colors.white} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.infoContainer}>
        <Text style={styles.petName} numberOfLines={1}>
          {submission.petName || 'Pet'}
        </Text>
      </View>

      {/* Vote Count */}
      <View style={styles.voteContainer}>
        <Icon name="heart" size={16} color={colors.primary} />
        <Text style={styles.voteCount}>{submission.voteCount}</Text>
      </View>

      {/* Current User Indicator */}
      {isCurrentUser && (
        <View style={styles.currentUserBadge}>
          <Text style={styles.currentUserText}>Bạn</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    marginBottom: 8,
    ...shadows.small,
  },
  currentUserContainer: {
    backgroundColor: colors.primaryPastel,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  topThreeContainer: {
    backgroundColor: '#FFFDE7',
  },
  rankContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  topThreeRank: {
    backgroundColor: 'transparent',
  },
  rankNumber: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textMedium,
  },
  rankEmoji: {
    fontSize: 22,
  },
  thumbnailWrapper: {
    position: 'relative',
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    overflow: 'hidden',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoIcon: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    marginRight: 8,
  },
  petName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
  },
  ownerName: {
    fontSize: typography.fontSize.sm,
    color: colors.textMedium,
    marginTop: 2,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.cardBackground,
    borderRadius: radius.sm,
  },
  voteCount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
  },
  currentUserBadge: {
    position: 'absolute',
    top: -6,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: radius.xs,
  },
  currentUserText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default LeaderboardItem;
