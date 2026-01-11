/**
 * EventDetailScreen
 * Modern event detail with submissions grid and leaderboard tabs
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  FlatList,
  Dimensions,
  RefreshControl,
  Modal,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  fetchEventById,
  fetchLeaderboard,
  voteSubmission,
  unvoteSubmission,
  optimisticVote,
  optimisticUnvote,
  rollbackVote,
  rollbackUnvote,
  selectCurrentEvent,
  selectLeaderboard,
  selectEventLoading,
  selectEventError,
  selectCurrentEventSubmissions,
  selectCurrentEventWinners,
  selectHasUserSubmitted,
  clearCurrentEvent,
  clearLeaderboard,
  clearError,
} from '../eventSlice';
import { useAuthCheck } from '../../../hooks/useAuthCheck';
import { SubmissionResponse, LeaderboardResponse, EventStatus } from '../../../types/event.types';
import {
  StatusBadge,
  CountdownTimer,
  SubmissionCard,
  SubmissionModal,
  WinnersSection,
  LeaderboardItem,
} from '../components';
import OptimizedImage from '../../../components/OptimizedImage';
import { colors, gradients, radius, shadows, spacing, typography } from '../../../theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const GRID_GAP = 8;
const GRID_COLUMNS = 3;
const CARD_WIDTH = (SCREEN_WIDTH - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;

type Props = NativeStackScreenProps<any, 'EventDetail'>;
type TabType = 'submissions' | 'leaderboard';


const EventDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { eventId } = route.params as { eventId: number };
  const dispatch = useAppDispatch();
  const { requireAuth } = useAuthCheck();

  const event = useAppSelector(selectCurrentEvent);
  const submissions = useAppSelector(selectCurrentEventSubmissions);
  const winners = useAppSelector(selectCurrentEventWinners);
  const leaderboard = useAppSelector(selectLeaderboard);
  const loading = useAppSelector(selectEventLoading);
  const error = useAppSelector(selectEventError);
  const hasUserSubmitted = useAppSelector(selectHasUserSubmitted);

  const [activeTab, setActiveTab] = useState<TabType>('submissions');
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionResponse | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [votingSubmissionId, setVotingSubmissionId] = useState<number | null>(null);
  const [showCoverImage, setShowCoverImage] = useState(false);

  // Sync selectedSubmission với Redux store khi submissions thay đổi (sau vote/unvote)
  useEffect(() => {
    if (selectedSubmission) {
      // Tìm trong submissions
      const fromSubmissions = submissions.find(
        s => s.submissionId === selectedSubmission.submissionId
      );
      // Tìm trong leaderboard
      const fromLeaderboard = leaderboard.find(
        l => l.submission.submissionId === selectedSubmission.submissionId
      )?.submission;
      
      const updatedSubmission = fromSubmissions || fromLeaderboard;
      
      if (updatedSubmission && (
        updatedSubmission.hasVoted !== selectedSubmission.hasVoted ||
        updatedSubmission.voteCount !== selectedSubmission.voteCount
      )) {
        setSelectedSubmission(updatedSubmission);
      }
    }
  }, [submissions, leaderboard, selectedSubmission]);

  useEffect(() => {
    dispatch(fetchEventById(eventId));
    return () => {
      dispatch(clearCurrentEvent());
      dispatch(clearLeaderboard());
      dispatch(clearError());
    };
  }, [dispatch, eventId]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      dispatch(fetchLeaderboard(eventId));
    }
  }, [activeTab, dispatch, eventId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchEventById(eventId));
    if (activeTab === 'leaderboard') {
      await dispatch(fetchLeaderboard(eventId));
    }
    setRefreshing(false);
  }, [dispatch, eventId, activeTab]);

  // Tính toán trạng thái realtime dựa trên thời gian hiện tại
  const getRealtimeStatus = useCallback((): EventStatus | null => {
    if (!event) return null;
    
    const now = new Date().getTime();
    const startTime = new Date(event.startTime).getTime();
    const submissionDeadline = new Date(event.submissionDeadline).getTime();
    const endTime = new Date(event.endTime).getTime();
    
    // Nếu event đã cancelled hoặc completed thì giữ nguyên
    if (event.status === 'cancelled' || event.status === 'completed') {
      return event.status;
    }
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now < submissionDeadline) {
      return 'active';
    } else if (now < endTime) {
      return 'submission_closed';
    } else {
      return 'voting_ended';
    }
  }, [event]);

  // State để track realtime status
  const [realtimeStatus, setRealtimeStatus] = useState<EventStatus | null>(null);

  // Update realtime status mỗi giây
  useEffect(() => {
    if (!event) return;
    
    const updateStatus = () => {
      const newStatus = getRealtimeStatus();
      setRealtimeStatus(newStatus);
    };
    
    updateStatus();
    const timer = setInterval(updateStatus, 1000);
    
    return () => clearInterval(timer);
  }, [event, getRealtimeStatus]);

  // Sync với server khi status thay đổi
  useEffect(() => {
    if (realtimeStatus && event && realtimeStatus !== event.status) {
      // Delay nhỏ để backend kịp update
      const timer = setTimeout(() => {
        dispatch(fetchEventById(eventId));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [realtimeStatus, event, dispatch, eventId]);

  // Sử dụng realtime status thay vì event.status
  const currentStatus = realtimeStatus || event?.status;
  const isVotingAllowed = currentStatus === 'active' || currentStatus === 'submission_closed';
  const isSubmissionAllowed = currentStatus === 'active';
  const isCompleted = currentStatus === 'completed' || currentStatus === 'voting_ended';

  // Rate limit cho vote - tối đa 1 lần mỗi 2 giây cho mỗi submission
  const voteTimestamps = React.useRef<Map<number, number>>(new Map());
  const VOTE_COOLDOWN_MS = 2000; // 2 giây

  const handleVote = useCallback(
    async (submissionId: number) => {
      if (votingSubmissionId) return;
      
      // Check rate limit
      const lastVoteTime = voteTimestamps.current.get(submissionId) || 0;
      const now = Date.now();
      if (now - lastVoteTime < VOTE_COOLDOWN_MS) {
        return; // Đang trong cooldown, bỏ qua
      }
      voteTimestamps.current.set(submissionId, now);

      const isAuth = await requireAuth('EventDetail', { eventId });
      if (!isAuth) return;

      const submission = submissions.find(s => s.submissionId === submissionId);
      if (!submission || submission.isOwner) return;

      setVotingSubmissionId(submissionId);

      if (submission.hasVoted) {
        dispatch(optimisticUnvote(submissionId));
        try {
          await dispatch(unvoteSubmission(submissionId)).unwrap();
        } catch {
          dispatch(rollbackUnvote(submissionId));
        }
      } else {
        dispatch(optimisticVote(submissionId));
        try {
          await dispatch(voteSubmission(submissionId)).unwrap();
        } catch {
          dispatch(rollbackVote(submissionId));
        }
      }
      setVotingSubmissionId(null);
    },
    [dispatch, submissions, votingSubmissionId, requireAuth, eventId]
  );

  const handleSubmissionPress = useCallback((submission: SubmissionResponse) => {
    setSelectedSubmission(submission);
    setModalVisible(true);
  }, []);

  const handleLeaderboardPress = useCallback((item: LeaderboardResponse) => {
    setSelectedSubmission(item.submission);
    setModalVisible(true);
  }, []);

  const handleWinnerPress = useCallback((submission: SubmissionResponse) => {
    setSelectedSubmission(submission);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setSelectedSubmission(null);
  }, []);

  const handleSubmitEntry = useCallback(async () => {
    const isAuth = await requireAuth('EventDetail', { eventId });
    if (!isAuth) return;
    navigation.navigate('SubmitEntry', { eventId });
  }, [navigation, eventId, requireAuth]);

  const formatDate = (dateString: string) => {
    let date: Date;
    if (dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('-', 10)) {
      date = new Date(dateString);
    } else {
      date = new Date(dateString + '+07:00');
    }
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const getCountdownTarget = (): string | null => {
    if (!event) return null;
    switch (currentStatus) {
      case 'upcoming': return event.startTime;
      case 'active': return event.submissionDeadline;
      case 'submission_closed': return event.endTime;
      default: return null;
    }
  };

  const getCountdownLabel = (): string => {
    if (!event) return '';
    switch (currentStatus) {
      case 'upcoming': return 'Bắt đầu sau';
      case 'active': return 'Hạn nộp còn';
      case 'submission_closed': return 'Kết thúc sau';
      default: return '';
    }
  };

  const renderSubmissionItem = useCallback(
    ({ item }: { item: SubmissionResponse }) => (
      <View style={styles.gridItem}>
        <SubmissionCard
          submission={item}
          onPress={handleSubmissionPress}
          onVote={handleVote}
          votingDisabled={!isVotingAllowed}
          isVoting={votingSubmissionId === item.submissionId}
        />
      </View>
    ),
    [handleSubmissionPress, handleVote, isVotingAllowed, votingSubmissionId]
  );

  const renderLeaderboardItem = useCallback(
    ({ item }: { item: LeaderboardResponse }) => (
      <LeaderboardItem
        item={item}
        isCurrentUser={item.submission.isOwner}
        onPress={handleLeaderboardPress}
      />
    ),
    [handleLeaderboardPress]
  );


  if (loading && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
        <View style={styles.loadingContainer}>
          <View style={styles.loadingSpinner}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !event) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color={colors.textDark} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sự kiện</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <View style={styles.errorIconBg}>
            <Icon name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={styles.errorTitle}>Không thể tải sự kiện</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => dispatch(fetchEventById(eventId))}
          >
            <LinearGradient colors={gradients.primary} style={styles.retryButtonGradient}>
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!event) return null;

  const countdownTarget = getCountdownTarget();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFBFC" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Chi tiết sự kiện</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        <TouchableOpacity 
          style={styles.coverContainer}
          onPress={() => setShowCoverImage(true)}
          activeOpacity={0.9}
        >
          <OptimizedImage
            source={{ uri: event.coverImageUrl }}
            style={styles.coverImage}
            imageSize="full"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.coverOverlay}
          />
          {/* Zoom hint */}
          <View style={styles.zoomHint}>
            <Icon name="expand-outline" size={16} color="#FFF" />
          </View>
          <View style={styles.coverContent}>
            <StatusBadge status={currentStatus || 'upcoming'} />
            <Text style={styles.coverTitle}>{event.title}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.infoCard}>
          {event.description && (
            <Text style={styles.description}>{event.description}</Text>
          )}

          {(event.prizeDescription || event.prizePoints > 0) && (
            <View style={styles.prizeSection}>
              <View style={styles.prizeIconBg}>
                <Icon name="trophy" size={20} color="#FFD700" />
              </View>
              <View style={styles.prizeContent}>
                <Text style={styles.prizeLabel}>Giải thưởng</Text>
                <Text style={styles.prizeText}>
                  {event.prizeDescription || `${event.prizePoints} điểm VIP`}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>Thời gian</Text>
            <View style={styles.timelineList}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#4CAF50' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Bắt đầu</Text>
                  <Text style={styles.timelineValue}>{formatDate(event.startTime)}</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#FF9800' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Hạn nộp bài</Text>
                  <Text style={styles.timelineValue}>{formatDate(event.submissionDeadline)}</Text>
                </View>
              </View>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, { backgroundColor: '#F44336' }]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Kết thúc</Text>
                  <Text style={styles.timelineValue}>{formatDate(event.endTime)}</Text>
                </View>
              </View>
            </View>
          </View>

          {countdownTarget && (
            <View style={styles.countdownSection}>
              <CountdownTimer 
                targetDate={countdownTarget} 
                label={getCountdownLabel()} 
              />
            </View>
          )}

          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: colors.primaryPastel }]}>
                <Icon name="camera" size={18} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{event.submissionCount}</Text>
              <Text style={styles.statLabel}>bài dự thi</Text>
            </View>
            <View style={styles.statCard}>
              <View style={[styles.statIconBg, { backgroundColor: '#FFE5EC' }]}>
                <Icon name="heart" size={18} color="#FF6B8A" />
              </View>
              <Text style={styles.statValue}>{event.totalVotes}</Text>
              <Text style={styles.statLabel}>lượt vote</Text>
            </View>
          </View>
        </View>

        {isCompleted && winners.length > 0 && (
          <View style={styles.winnersContainer}>
            <WinnersSection winners={winners} onWinnerPress={handleWinnerPress} />
          </View>
        )}


        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'submissions' && styles.tabActive]}
            onPress={() => setActiveTab('submissions')}
          >
            <Icon 
              name="images-outline" 
              size={18} 
              color={activeTab === 'submissions' ? colors.primary : colors.textMedium} 
            />
            <Text style={[styles.tabText, activeTab === 'submissions' && styles.tabTextActive]}>
              Bài dự thi
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'leaderboard' && styles.tabActive]}
            onPress={() => setActiveTab('leaderboard')}
          >
            <Icon 
              name="podium-outline" 
              size={18} 
              color={activeTab === 'leaderboard' ? colors.primary : colors.textMedium} 
            />
            <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.tabTextActive]}>
              Bảng xếp hạng
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'submissions' ? (
            submissions.length > 0 ? (
              <FlatList
                key={`submissions-grid-${GRID_COLUMNS}`}
                data={submissions}
                renderItem={renderSubmissionItem}
                keyExtractor={item => item.submissionId.toString()}
                numColumns={GRID_COLUMNS}
                columnWrapperStyle={styles.gridRow}
                scrollEnabled={false}
                contentContainerStyle={styles.gridContainer}
              />
            ) : (
              <View style={styles.emptyTab}>
                <View style={styles.emptyIconBg}>
                  <Icon name="images-outline" size={32} color={colors.textLight} />
                </View>
                <Text style={styles.emptyTabTitle}>Chưa có bài dự thi</Text>
                <Text style={styles.emptyTabText}>Hãy là người đầu tiên tham gia!</Text>
              </View>
            )
          ) : loading ? (
            <View style={styles.tabLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : leaderboard.length > 0 ? (
            <FlatList
              key="leaderboard-list"
              data={leaderboard}
              renderItem={renderLeaderboardItem}
              keyExtractor={item => item.submission.submissionId.toString()}
              scrollEnabled={false}
              contentContainerStyle={styles.leaderboardContainer}
            />
          ) : (
            <View style={styles.emptyTab}>
              <View style={styles.emptyIconBg}>
                <Icon name="podium-outline" size={32} color={colors.textLight} />
              </View>
              <Text style={styles.emptyTabTitle}>Chưa có dữ liệu</Text>
              <Text style={styles.emptyTabText}>Bảng xếp hạng sẽ hiển thị khi có bài dự thi</Text>
            </View>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {isSubmissionAllowed && !hasUserSubmitted && (
        <View style={styles.bottomAction}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmitEntry}>
            <LinearGradient 
              colors={gradients.primary} 
              style={styles.submitButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Icon name="add-circle-outline" size={22} color={colors.white} />
              <Text style={styles.submitButtonText}>Tham gia cuộc thi</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {hasUserSubmitted && (
        <View style={styles.bottomAction}>
          <View style={styles.submittedBadge}>
            <Icon name="checkmark-circle" size={20} color={colors.success} />
            <Text style={styles.submittedBadgeText}>Bạn đã tham gia cuộc thi này</Text>
          </View>
        </View>
      )}

      <SubmissionModal
        visible={modalVisible}
        submission={selectedSubmission}
        onClose={handleCloseModal}
        onVote={handleVote}
        votingDisabled={!isVotingAllowed}
        isVoting={votingSubmissionId === selectedSubmission?.submissionId}
      />

      {/* Cover Image Full Screen Modal */}
      <Modal
        visible={showCoverImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCoverImage(false)}
      >
        <View style={styles.imageModalContainer}>
          <StatusBar backgroundColor="#000" barStyle="light-content" />
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setShowCoverImage(false)}
          >
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <OptimizedImage
            source={{ uri: event.coverImageUrl }}
            style={styles.fullCoverImage}
            imageSize="full"
            resizeMode="contain"
          />
          
          <View style={styles.imageModalInfo}>
            <Text style={styles.imageModalTitle}>{event.title}</Text>
            <StatusBadge status={currentStatus || 'upcoming'} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FAFBFC',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.small,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
    marginHorizontal: spacing.sm,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.lg,
  },
  loadingSpinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.medium,
  },
  loadingText: {
    fontSize: 15,
    color: colors.textMedium,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  errorIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: 15,
    color: colors.textMedium,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  retryButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  retryButtonGradient: {
    paddingHorizontal: spacing.xl,
    paddingVertical: 14,
  },
  retryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
  coverContainer: {
    position: 'relative',
    height: 220,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 140,
  },
  zoomHint: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coverContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  coverTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
    lineHeight: 28,
  },
  infoCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: -20,
    borderRadius: 20,
    padding: spacing.lg,
    gap: spacing.lg,
    ...shadows.medium,
  },
  description: {
    fontSize: 15,
    color: colors.textMedium,
    lineHeight: 22,
  },
  prizeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
    padding: spacing.md,
    borderRadius: 14,
    gap: spacing.md,
  },
  prizeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  prizeContent: {
    flex: 1,
  },
  prizeLabel: {
    fontSize: 12,
    color: colors.textMedium,
    marginBottom: 2,
  },
  prizeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  timelineSection: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: spacing.xs,
  },
  timelineList: {
    gap: spacing.sm,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  timelineContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineLabel: {
    fontSize: 13,
    color: colors.textMedium,
  },
  timelineValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  countdownSection: {
    backgroundColor: '#F8F9FA',
    padding: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
  },
  statsSection: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 14,
    padding: spacing.md,
    alignItems: 'center',
    gap: 6,
  },
  statIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
  },
  winnersContainer: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    backgroundColor: '#F0F2F5',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.white,
    ...shadows.small,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textMedium,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 200,
  },
  gridContainer: {
    gap: GRID_GAP,
  },
  gridRow: {
    gap: GRID_GAP,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  leaderboardContainer: {
    gap: spacing.xs,
  },
  emptyTab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyIconBg: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#F0F2F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emptyTabTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
  },
  emptyTabText: {
    fontSize: 14,
    color: colors.textMedium,
  },
  tabLoading: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    paddingBottom: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: '#F0F2F5',
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.button,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    backgroundColor: '#E8F5E9',
    borderRadius: 14,
  },
  submittedBadgeText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.success,
  },
  // Cover Image Modal
  imageModalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullCoverImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  imageModalInfo: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  imageModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default EventDetailScreen;
