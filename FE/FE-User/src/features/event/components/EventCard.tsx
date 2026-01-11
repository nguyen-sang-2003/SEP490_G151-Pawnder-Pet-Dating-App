import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
// @ts-ignore
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { EventResponse } from '../../../types/event.types';
import { colors, shadows } from '../../../theme';
import OptimizedImage from '../../../components/OptimizedImage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface EventCardProps {
  event: EventResponse;
  onPress: (eventId: number) => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: string }> = {
  upcoming: { label: 'Sắp diễn ra', color: '#3B82F6', bgColor: '#EFF6FF', icon: 'time-outline' },
  active: { label: 'Đang diễn ra', color: '#10B981', bgColor: '#ECFDF5', icon: 'flash-outline' },
  submission_closed: { label: 'Đang bình chọn', color: '#F59E0B', bgColor: '#FFFBEB', icon: 'heart-outline' },
  voting_ended: { label: 'Chờ kết quả', color: '#8B5CF6', bgColor: '#F5F3FF', icon: 'hourglass-outline' },
  completed: { label: 'Đã kết thúc', color: '#6B7280', bgColor: '#F3F4F6', icon: 'checkmark-circle-outline' },
  cancelled: { label: 'Đã hủy', color: '#EF4444', bgColor: '#FEF2F2', icon: 'close-circle-outline' },
};

const EventCard: React.FC<EventCardProps> = ({ event, onPress }) => {
  const [showFullImage, setShowFullImage] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ prefix: string; timeStr: string } | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState(event.status);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Tính realtime status dựa trên thời gian thực
  const calculateRealtimeStatus = () => {
    // Nếu event đã cancelled hoặc completed thì giữ nguyên
    if (event.status === 'cancelled' || event.status === 'completed') {
      return event.status;
    }
    
    const now = new Date().getTime();
    const startTime = new Date(event.startTime).getTime();
    const submissionDeadline = new Date(event.submissionDeadline).getTime();
    const endTime = new Date(event.endTime).getTime();
    
    if (now < startTime) {
      return 'upcoming';
    } else if (now < submissionDeadline) {
      return 'active';
    } else if (now < endTime) {
      return 'submission_closed';
    } else {
      return 'voting_ended';
    }
  };
  
  const calculateTimeLeft = (status: string) => {
    const now = new Date();
    let targetDate: Date;
    let prefix = '';
    
    switch (status) {
      case 'upcoming':
        targetDate = new Date(event.startTime);
        prefix = 'Bắt đầu';
        break;
      case 'active':
        targetDate = new Date(event.submissionDeadline);
        prefix = 'Hạn nộp';
        break;
      case 'submission_closed':
        targetDate = new Date(event.endTime);
        prefix = 'Kết thúc';
        break;
      default:
        return null;
    }
    
    const diff = targetDate.getTime() - now.getTime();
    if (diff <= 0) return null;
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeStr = '';
    if (days > 0) {
      timeStr = `${days}d ${hours}h`;
    } else if (hours > 0) {
      timeStr = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      timeStr = `${minutes}m ${seconds}s`;
    } else {
      timeStr = `${seconds}s`;
    }
    
    return { prefix, timeStr };
  };

  // Realtime countdown và status update
  useEffect(() => {
    const updateTimeAndStatus = () => {
      const newStatus = calculateRealtimeStatus();
      setRealtimeStatus(newStatus);
      setTimeLeft(calculateTimeLeft(newStatus));
    };
    
    updateTimeAndStatus();
    
    timerRef.current = setInterval(updateTimeAndStatus, 1000);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [event.status, event.startTime, event.submissionDeadline, event.endTime]);

  // Sử dụng realtime status thay vì event.status
  const statusConfig = STATUS_CONFIG[realtimeStatus] || STATUS_CONFIG.completed;
  const isActive = realtimeStatus === 'active';

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(event.eventId)}
        activeOpacity={0.95}
      >
        {/* Cover Image - Tappable to view full */}
        <TouchableOpacity 
          style={styles.imageContainer}
          onPress={() => setShowFullImage(true)}
          activeOpacity={0.9}
        >
          <OptimizedImage
            source={{ uri: event.coverImageUrl || '' }}
            style={styles.coverImage}
            imageSize="full"
          />
          
          {/* Zoom hint */}
          <View style={styles.zoomHint}>
            <Icon name="expand-outline" size={14} color="#FFF" />
          </View>
          
          {/* Status Badge */}
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Icon name={statusConfig.icon} size={12} color={statusConfig.color} />
            <Text style={[styles.statusText, { color: statusConfig.color }]}>
              {statusConfig.label}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>{event.title}</Text>
          
          {/* Prize */}
          {event.prizeDescription && (
            <View style={styles.prizeRow}>
              <Icon name="trophy" size={14} color="#F59E0B" />
              <Text style={styles.prizeText} numberOfLines={1}>
                {event.prizeDescription}
              </Text>
            </View>
          )}

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="images-outline" size={14} color="#EC4899" />
              <Text style={styles.statValue}>{event.submissionCount}</Text>
              <Text style={styles.statLabel}>bài thi</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Icon name="heart" size={14} color="#F59E0B" />
              <Text style={styles.statValue}>{event.totalVotes}</Text>
              <Text style={styles.statLabel}>votes</Text>
            </View>
            
            {/* Time info */}
            {timeLeft && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.timeInfo}>
                  <Text style={styles.timePrefix}>{timeLeft.prefix}</Text>
                  <Text style={styles.timeValue}>{timeLeft.timeStr}</Text>
                </View>
              </>
            )}
          </View>

          {/* CTA Button */}
          <TouchableOpacity 
            style={styles.ctaButton}
            onPress={() => onPress(event.eventId)}
          >
            <LinearGradient
              colors={isActive ? ['#EC4899', '#8B5CF6'] : ['#F3F4F6', '#E5E7EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, isActive && styles.ctaTextActive]}>
                {isActive ? 'Tham gia ngay' : 'Xem chi tiết'}
              </Text>
              <Icon 
                name="arrow-forward" 
                size={16} 
                color={isActive ? '#FFF' : '#6B7280'} 
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Full Image Modal */}
      <Modal
        visible={showFullImage}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFullImage(false)}
      >
        <StatusBar backgroundColor="#000" barStyle="light-content" />
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.modalClose}
            onPress={() => setShowFullImage(false)}
          >
            <Icon name="close" size={28} color="#FFF" />
          </TouchableOpacity>
          
          <OptimizedImage
            source={{ uri: event.coverImageUrl || '' }}
            style={styles.fullImage}
            imageSize="full"
            resizeMode="contain"
          />
          
          <View style={styles.modalInfo}>
            <Text style={styles.modalTitle}>{event.title}</Text>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_CONFIG[realtimeStatus]?.bgColor || statusConfig.bgColor }]}>
              <Icon name={STATUS_CONFIG[realtimeStatus]?.icon || statusConfig.icon} size={12} color={STATUS_CONFIG[realtimeStatus]?.color || statusConfig.color} />
              <Text style={[styles.statusText, { color: STATUS_CONFIG[realtimeStatus]?.color || statusConfig.color }]}>
                {STATUS_CONFIG[realtimeStatus]?.label || statusConfig.label}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    ...shadows.medium,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    padding: 14,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    lineHeight: 22,
  },
  prizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  prizeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#B45309',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMedium,
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  timeInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  timePrefix: {
    fontSize: 10,
    color: colors.textMedium,
  },
  timeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EC4899',
  },
  ctaButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 4,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  ctaTextActive: {
    color: '#FFF',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
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
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.7,
  },
  modalInfo: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
});

export default EventCard;
