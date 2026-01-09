/**
 * My Appointments Screen
 * Displays list of all user's appointments with filters
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
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
} from '../appointmentSlice';
import {
  AppointmentResponse,
  APPOINTMENT_STATUS_CONFIG,
  ACTIVITY_TYPES,
} from '../../../types/appointment.types';
import { colors, gradients, radius, shadows } from '../../../theme';
import BottomNav from '../../../components/BottomNav';

type Props = NativeStackScreenProps<RootStackParamList, 'MyAppointments'>;

type FilterType = 'upcoming' | 'past' | 'all';

const MyAppointmentsScreen = ({ navigation }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const appointments = useSelector(selectAppointments);
  const upcomingAppointments = useSelector(selectUpcomingAppointments);
  const pastAppointments = useSelector(selectPastAppointments);
  const loading = useSelector(selectAppointmentLoading);

  const [filter, setFilter] = useState<FilterType>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  // Load appointments when screen focuses
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchMyAppointments());
    }, [dispatch])
  );

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchMyAppointments());
    setRefreshing(false);
  };

  // Get filtered appointments
  const getFilteredAppointments = (): AppointmentResponse[] => {
    switch (filter) {
      case 'upcoming':
        return upcomingAppointments;
      case 'past':
        return pastAppointments;
      case 'all':
      default:
        return appointments;
    }
  };

  const filteredAppointments = getFilteredAppointments();

  // Format date/time
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Hôm nay';
    if (isTomorrow) return 'Ngày mai';

    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Render appointment card
  const renderAppointmentCard = ({ item }: { item: AppointmentResponse }) => {
    const statusConfig = APPOINTMENT_STATUS_CONFIG[item.status];
    const activityType = ACTIVITY_TYPES[item.activityType as keyof typeof ACTIVITY_TYPES];

    return (
      <TouchableOpacity
        style={[styles.card, shadows.medium]}
        onPress={() => navigation.navigate('AppointmentDetail', { appointmentId: item.appointmentId })}
        activeOpacity={0.7}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
            {statusConfig.icon} {statusConfig.label}
          </Text>
        </View>

        {/* Pets Info */}
        <View style={styles.petsContainer}>
          <View style={styles.petInfo}>
            <View style={styles.petAvatar}>
              <Icon name="paw" size={24} color={colors.primary} />
            </View>
            <Text style={styles.petName} numberOfLines={1}>
              {item.inviterPetName}
            </Text>
          </View>

          <Icon name="heart" size={20} color={colors.error} />

          <View style={styles.petInfo}>
            <View style={styles.petAvatar}>
              <Icon name="paw" size={24} color={colors.secondary} />
            </View>
            <Text style={styles.petName} numberOfLines={1}>
              {item.inviteePetName}
            </Text>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateTimeRow}>
            <Icon name="calendar-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateTimeText}>{formatDate(item.appointmentDateTime)}</Text>
          </View>
          <View style={styles.dateTimeRow}>
            <Icon name="time-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.dateTimeText}>{formatTime(item.appointmentDateTime)}</Text>
          </View>
        </View>

        {/* Activity Type */}
        <View style={styles.activityContainer}>
          <Text style={styles.activityIcon}>{activityType?.icon || '🎾'}</Text>
          <Text style={styles.activityText}>{activityType?.label || item.activityType}</Text>
        </View>

        {/* Location */}
        {item.location && (
          <View style={styles.locationContainer}>
            <Icon name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText} numberOfLines={1}>
              {item.location.name}
            </Text>
          </View>
        )}

        {/* Check-in status for confirmed appointments */}
        {item.status === 'confirmed' || item.status === 'on_going' ? (
          <View style={styles.checkInContainer}>
            <View style={styles.checkInStatus}>
              <Icon
                name={item.inviterCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={item.inviterCheckedIn ? colors.success : colors.border}
              />
              <Text style={styles.checkInText}>{item.inviterPetName}</Text>
            </View>
            <View style={styles.checkInStatus}>
              <Icon
                name={item.inviteeCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={item.inviteeCheckedIn ? colors.success : colors.border}
              />
              <Text style={styles.checkInText}>{item.inviteePetName}</Text>
            </View>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="calendar-outline" size={80} color={colors.border} />
      <Text style={styles.emptyTitle}>
        {filter === 'upcoming' ? 'Chưa có cuộc hẹn sắp tới' : 
         filter === 'past' ? 'Chưa có cuộc hẹn đã qua' : 
         'Chưa có cuộc hẹn nào'}
      </Text>
      <Text style={styles.emptyText}>
        {filter === 'upcoming' 
          ? 'Hãy tạo lịch hẹn với những match của bạn để gặp gỡ!' 
          : 'Các cuộc hẹn của bạn sẽ hiển thị ở đây'}
      </Text>
    </View>
  );

  // Render filter tabs
  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[styles.filterTab, filter === 'upcoming' && styles.filterTabActive]}
        onPress={() => setFilter('upcoming')}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, filter === 'upcoming' && styles.filterTextActive]}>
          Sắp tới ({upcomingAppointments.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'past' && styles.filterTabActive]}
        onPress={() => setFilter('past')}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, filter === 'past' && styles.filterTextActive]}>
          Đã qua ({pastAppointments.length})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
        onPress={() => setFilter('all')}
        activeOpacity={0.7}
      >
        <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
          Tất cả ({appointments.length})
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch hẹn của bạn</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      {/* Filter Tabs */}
      {renderFilterTabs()}

      {/* Appointments List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Đang tải...</Text>
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

      {/* Bottom Navigation */}
      <BottomNav navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.medium,
    backgroundColor: colors.background,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.large,
    padding: 16,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.small,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  petsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  petAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  activityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activityIcon: {
    fontSize: 20,
  },
  activityText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
  },
  checkInContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkInStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  checkInText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});

export default MyAppointmentsScreen;
