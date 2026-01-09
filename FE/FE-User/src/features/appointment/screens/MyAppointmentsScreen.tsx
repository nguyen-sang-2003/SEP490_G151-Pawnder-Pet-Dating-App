/**
 * My Appointments Screen
 * Quản lý lịch hẹn - Giao diện tối ưu
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import {
  fetchMyAppointments,
  selectAppointments,
  selectAppointmentLoading,
  selectUpcomingAppointments,
  selectPastAppointments,
  selectOngoingAppointments,
  selectCompletedAppointments,
} from '../appointmentSlice';
import {
  AppointmentResponse,
  APPOINTMENT_STATUS_CONFIG,
  ACTIVITY_TYPES,
} from '../../../types/appointment.types';
import { colors, gradients, radius, shadows } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'MyAppointments'>;

type FilterType = 'upcoming' | 'ongoing' | 'completed' | 'past' | 'all';

// Activity icons
const ACTIVITY_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
  walk: { icon: 'walk', color: '#4CAF50', bg: '#E8F5E9' },
  cafe: { icon: 'cafe', color: '#795548', bg: '#EFEBE9' },
  playdate: { icon: 'game-controller', color: '#2196F3', bg: '#E3F2FD' },
};

const MyAppointmentsScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const appointments = useSelector(selectAppointments);
  const upcomingAppointments = useSelector(selectUpcomingAppointments);
  const pastAppointments = useSelector(selectPastAppointments);
  const ongoingAppointments = useSelector(selectOngoingAppointments);
  const completedAppointments = useSelector(selectCompletedAppointments);
  const loading = useSelector(selectAppointmentLoading);

  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyAppointments());
    }, [dispatch])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyAppointments());
    setRefreshing(false);
  };

  const getFilteredAppointments = (): AppointmentResponse[] => {
    let result: AppointmentResponse[];
    switch (filter) {
      case 'upcoming':
        result = upcomingAppointments;
        break;
      case 'ongoing':
        result = ongoingAppointments;
        break;
      case 'completed':
        result = completedAppointments;
        break;
      case 'past':
        result = pastAppointments;
        break;
      default:
        result = [...appointments].sort((a, b) => 
          new Date(b.appointmentDateTime).getTime() - new Date(a.appointmentDateTime).getTime()
        );
    }
    return result;
  };

  const filteredAppointments = getFilteredAppointments();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Hôm nay';
    if (date.toDateString() === tomorrow.toDateString()) return 'Ngày mai';

    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return `${days[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusStyle = (status: string) => {
    const config = APPOINTMENT_STATUS_CONFIG[status as keyof typeof APPOINTMENT_STATUS_CONFIG];
    return config || { label: status, color: '#666', bgColor: '#F5F5F5', icon: '📋' };
  };

  const renderAppointmentCard = ({ item }: { item: AppointmentResponse }) => {
    const statusConfig = getStatusStyle(item.status);
    const activityConfig = ACTIVITY_ICONS[item.activityType] || ACTIVITY_ICONS.playdate;
    const isPending = item.status === 'pending';
    const isConfirmed = item.status === 'confirmed';

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.appointmentId })}
        activeOpacity={0.7}
      >
        {/* Header với status */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
            <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
          </View>
          <View style={styles.dateTimeBadge}>
            <Text style={styles.dateText}>{formatDate(item.appointmentDateTime)}</Text>
            <Text style={styles.timeText}>{formatTime(item.appointmentDateTime)}</Text>
          </View>
        </View>

        {/* Pet match info */}
        <View style={styles.matchSection}>
          <View style={styles.petCard}>
            <LinearGradient colors={['#FFE4EC', '#FFF0F5']} style={styles.petAvatar}>
              <Icon name="paw" size={22} color={colors.primary} />
            </LinearGradient>
            <Text style={styles.petName} numberOfLines={1}>{item.inviterPetName}</Text>
            <Text style={styles.petRole}>Bé nhà bạn</Text>
          </View>

          <View style={styles.matchIconContainer}>
            <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.heartBadge}>
              <Icon name="heart" size={14} color="#FFF" />
            </LinearGradient>
          </View>

          <View style={styles.petCard}>
            <LinearGradient colors={['#E3F2FD', '#E8F4FD']} style={styles.petAvatar}>
              <Icon name="paw" size={22} color="#2196F3" />
            </LinearGradient>
            <Text style={styles.petName} numberOfLines={1}>{item.inviteePetName}</Text>
            <Text style={styles.petRole}>Đối phương</Text>
          </View>
        </View>

        {/* Activity & Location */}
        <View style={styles.detailsSection}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: activityConfig.bg }]}>
              <Icon name={activityConfig.icon} size={16} color={activityConfig.color} />
            </View>
            <Text style={styles.detailText}>
              {ACTIVITY_TYPES[item.activityType as keyof typeof ACTIVITY_TYPES]?.label || item.activityType}
            </Text>
          </View>

          {item.location && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIcon, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="location" size={16} color="#4CAF50" />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>{item.location.name}</Text>
            </View>
          )}
        </View>

        {/* Check-in status */}
        {(isConfirmed || item.status === 'on_going') && (
          <View style={styles.checkInSection}>
            <Text style={styles.checkInTitle}>Check-in</Text>
            <View style={styles.checkInRow}>
              <View style={styles.checkInItem}>
                <Icon
                  name={item.inviterCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={item.inviterCheckedIn ? '#4CAF50' : '#DDD'}
                />
                <Text style={[styles.checkInName, item.inviterCheckedIn && styles.checkInDone]}>
                  {item.inviterPetName}
                </Text>
              </View>
              <View style={styles.checkInItem}>
                <Icon
                  name={item.inviteeCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                  size={18}
                  color={item.inviteeCheckedIn ? '#4CAF50' : '#DDD'}
                />
                <Text style={[styles.checkInName, item.inviteeCheckedIn && styles.checkInDone]}>
                  {item.inviteePetName}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action hint */}
        <View style={styles.cardFooter}>
          <Text style={styles.tapHint}>Nhấn để xem chi tiết</Text>
          <Icon name="chevron-forward" size={16} color={colors.textLight} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient colors={['#FFE4EC', '#FFF0F5']} style={styles.emptyIcon}>
        <Icon name="calendar-outline" size={48} color={colors.primary} />
      </LinearGradient>
      <Text style={styles.emptyTitle}>
        {filter === 'upcoming' ? 'Chưa có lịch hẹn sắp tới' :
         filter === 'ongoing' ? 'Không có cuộc hẹn đang diễn ra' :
         filter === 'completed' ? 'Chưa có cuộc hẹn hoàn thành' :
         filter === 'past' ? 'Chưa có lịch hẹn đã qua' :
         'Chưa có lịch hẹn nào'}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'upcoming'
          ? 'Hãy tạo lịch hẹn với những match của bạn!'
          : 'Các cuộc hẹn sẽ hiển thị ở đây'}
      </Text>
    </View>
  );

  const filterTabs = [
    { id: 'all' as FilterType, label: 'Tất cả', count: appointments.length, icon: 'list' },
    { id: 'upcoming' as FilterType, label: 'Sắp tới', count: upcomingAppointments.length, icon: 'time' },
    { id: 'ongoing' as FilterType, label: 'Đang diễn ra', count: ongoingAppointments.length, icon: 'play-circle' },
    { id: 'completed' as FilterType, label: 'Hoàn thành', count: completedAppointments.length, icon: 'checkmark-circle' },
    { id: 'past' as FilterType, label: 'Đã qua', count: pastAppointments.length, icon: 'archive' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.chat} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Lịch hẹn</Text>
          <Text style={styles.headerSubtitle}>{appointments.length} cuộc hẹn</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.headerBtn}>
          <Icon name="refresh" size={22} color={colors.white} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
        style={styles.filterContainer}
      >
        {filterTabs.map((tab) => {
          const isActive = filter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.filterTab, isActive && styles.filterTabActive]}
              onPress={() => setFilter(tab.id)}
              activeOpacity={0.7}
            >
              <Icon
                name={tab.icon}
                size={16}
                color={isActive ? colors.white : colors.textMedium}
              />
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {tab.label}
              </Text>
              <View style={[styles.filterBadge, isActive && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, isActive && styles.filterBadgeTextActive]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải lịch hẹn...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          renderItem={renderAppointmentCard}
          keyExtractor={(item) => item.appointmentId.toString()}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },

  // Filter
  filterContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    flexGrow: 0,
    flexShrink: 0,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    gap: 5,
    height: 36,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMedium,
  },
  filterTextActive: {
    color: colors.white,
  },
  filterBadge: {
    backgroundColor: '#E0E0E0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 18,
    alignItems: 'center',
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMedium,
  },
  filterBadgeTextActive: {
    color: colors.white,
  },

  // List
  listContent: {
    padding: 16,
    paddingBottom: 20,
  },

  // Card
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadows.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateTimeBadge: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 1,
  },

  // Match section
  matchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  petCard: {
    flex: 1,
    alignItems: 'center',
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  petName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
    textAlign: 'center',
  },
  petRole: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 1,
  },
  matchIconContainer: {
    paddingHorizontal: 12,
  },
  heartBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Details
  detailsSection: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMedium,
  },

  // Check-in
  checkInSection: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 10,
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
  },
  checkInTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
  },
  checkInRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  checkInItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkInName: {
    fontSize: 12,
    color: colors.textMedium,
  },
  checkInDone: {
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    gap: 4,
  },
  tapHint: {
    fontSize: 12,
    color: colors.textLight,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMedium,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default MyAppointmentsScreen;
