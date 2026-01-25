import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import { SubmissionResponse } from '../../../types/event.types';
import { colors, radius, shadows, typography } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SubmissionModalProps {
  visible: boolean;
  submission: SubmissionResponse | null;
  onClose: () => void;
  onVote: (submissionId: number) => void;
  votingDisabled?: boolean;
  isVoting?: boolean;
}

/**
 * SubmissionModal Component
 * Displays full media (image/video), caption, pet info, owner info
 * Includes vote button with proper states
 */
const SubmissionModal: React.FC<SubmissionModalProps> = ({
  visible,
  submission,
  onClose,
  onVote,
  votingDisabled = false,
  isVoting = false,
}) => {
  if (!submission) return null;

  const handleVote = () => {
    if (!submission.isOwner && !votingDisabled && !isVoting) {
      onVote(submission.submissionId);
    }
  };

  const renderVoteButton = () => {
    if (submission.isOwner) {
      return (
        <View style={styles.ownerBadge}>
          <Icon name="ribbon" size={18} color={colors.purple} />
          <Text style={styles.ownerBadgeText}>Bài dự thi của bạn</Text>
        </View>
      );
    }

    if (votingDisabled) {
      return (
        <View style={styles.votingClosedBadge}>
          <Icon name="lock-closed" size={18} color={colors.textMedium} />
          <Text style={styles.votingClosedText}>Đã hết thời gian vote</Text>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.voteButton,
          submission.hasVoted && styles.voteButtonActive,
        ]}
        onPress={handleVote}
        disabled={isVoting}
        activeOpacity={0.8}
      >
        {isVoting ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <>
            <Icon
              name={submission.hasVoted ? 'heart' : 'heart-outline'}
              size={22}
              color={submission.hasVoted ? colors.white : colors.primary}
            />
            <Text
              style={[
                styles.voteButtonText,
                submission.hasVoted && styles.voteButtonTextActive,
              ]}
            >
              {submission.hasVoted ? 'Đã vote' : 'Vote cho bé'}
            </Text>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={colors.textDark} />
          </TouchableOpacity>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Media */}
            <View style={styles.mediaContainer}>
              <OptimizedImage
                source={{ uri: submission.mediaUrl }}
                style={styles.media}
                imageSize="full"
              />
              {submission.mediaType === 'video' && (
                <View style={styles.playButton}>
                  <Icon name="play-circle" size={60} color={colors.white} />
                </View>
              )}
            </View>

            {/* Pet & Owner Info */}
            <View style={styles.infoSection}>
              <View style={styles.petInfo}>
                {submission.petPhotoUrl ? (
                  <OptimizedImage
                    source={{ uri: submission.petPhotoUrl }}
                    style={styles.petAvatar}
                    imageSize="thumbnail"
                  />
                ) : (
                  <View style={styles.petAvatarPlaceholder}>
                    <Icon name="paw" size={24} color={colors.textLight} />
                  </View>
                )}
                <View style={styles.petDetails}>
                  <Text style={styles.petName}>
                    {submission.petName || 'Pet'}
                  </Text>
                </View>
              </View>

              {/* Caption */}
              {submission.caption && (
                <Text style={styles.caption}>{submission.caption}</Text>
              )}

              {/* Vote count */}
              <View style={styles.voteCountRow}>
                <Icon name="heart" size={18} color={colors.primary} />
                <Text style={styles.voteCountText}>
                  {submission.voteCount} lượt vote
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Vote Button */}
          <View style={styles.footer}>{renderVoteButton()}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    padding: 4,
  },
  scrollView: {
    marginTop: 20,
  },
  mediaContainer: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4,
    backgroundColor: colors.cardBackground,
    borderRadius: 0,
    overflow: 'hidden',
  },
  media: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  infoSection: {
    padding: 16,
    gap: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBackground,
  },
  petAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  petDetails: {
    flex: 1,
  },
  petName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textDark,
  },
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ownerName: {
    fontSize: typography.fontSize.sm,
    color: colors.textMedium,
  },
  caption: {
    fontSize: typography.fontSize.base,
    color: colors.textDark,
    lineHeight: 22,
  },
  voteCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voteCountText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textDark,
  },
  footer: {
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  voteButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  voteButtonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  voteButtonTextActive: {
    color: colors.white,
  },
  ownerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.purpleLight,
  },
  ownerBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.purple,
  },
  votingClosedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.border,
  },
  votingClosedText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.textMedium,
  },
});

export default SubmissionModal;
