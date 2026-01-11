import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SubmissionResponse } from '../../../types/event.types';
import { colors, radius, shadows, typography, gradients } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

interface SubmissionCardProps {
  submission: SubmissionResponse;
  onPress: (submission: SubmissionResponse) => void;
  onVote: (submissionId: number) => void;
  votingDisabled?: boolean;
  isVoting?: boolean;
}

/**
 * SubmissionCard Component
 * Modern card with thumbnail, pet name, vote count
 */
const SubmissionCard: React.FC<SubmissionCardProps> = ({
  submission,
  onPress,
  onVote,
  votingDisabled = false,
  isVoting = false,
}) => {
  const handleVotePress = (e: any) => {
    e.stopPropagation();
    if (!submission.isOwner && !votingDisabled && !isVoting) {
      onVote(submission.submissionId);
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(submission)}
      activeOpacity={0.9}
    >
      {/* Thumbnail */}
      <View style={styles.imageContainer}>
        <OptimizedImage
          source={{ uri: submission.thumbnailUrl || submission.mediaUrl || '' }}
          style={styles.thumbnail}
          imageSize="thumbnail"
        />
        
        {/* Video indicator */}
        {submission.mediaType === 'video' && (
          <View style={styles.videoIndicator}>
            <Icon name="play" size={16} color={colors.white} />
          </View>
        )}

        {/* Owner badge */}
        {submission.isOwner && (
          <View style={styles.ownerBadge}>
            <Icon name="person" size={10} color={colors.white} />
          </View>
        )}

        {/* Vote overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.voteOverlay}
        >
          <TouchableOpacity
            style={[
              styles.voteButton,
              submission.hasVoted && styles.voteButtonActive,
            ]}
            onPress={handleVotePress}
            disabled={votingDisabled || isVoting || submission.isOwner}
            activeOpacity={0.8}
          >
            {isVoting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Icon
                  name={submission.hasVoted ? 'heart' : 'heart-outline'}
                  size={12}
                  color={colors.white}
                />
                <Text style={styles.voteCount}>{submission.voteCount}</Text>
              </>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* Pet name */}
      <View style={styles.info}>
        <Text style={styles.petName} numberOfLines={1}>
          {submission.petName || 'Pet'}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.small,
  },
  imageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  videoIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ownerBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voteOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  voteButtonActive: {
    backgroundColor: colors.primary,
  },
  voteCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
  },
  info: {
    padding: 8,
  },
  petName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
});

export default SubmissionCard;
