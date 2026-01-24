/**
 * Appointment Card Component
 * Display appointment info in chat or list
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import {
  AppointmentResponse,
  APPOINTMENT_STATUS_CONFIG,
  ACTIVITY_TYPES,
} from '../../../types/appointment.types';
import { colors, radius, shadows } from '../../../theme';

interface AppointmentCardProps {
  appointment: AppointmentResponse;
  compact?: boolean;
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, compact = false }) => {
  const navigation = useNavigation<NavigationProp>();

  const statusConfig = APPOINTMENT_STATUS_CONFIG[appointment.status];
  const activityType = ACTIVITY_TYPES[appointment.activityType as keyof typeof ACTIVITY_TYPES];

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    let dateStr = '';
    if (isToday) dateStr = 'Hôm nay';
    else if (isTomorrow) dateStr = 'Ngày mai';
    else
      dateStr = date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
      });

    const timeStr = date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return `${dateStr}, ${timeStr}`;
  };

  const handlePress = () => {
    navigation.navigate('AppointmentDetail', { appointmentId: appointment.appointmentId });
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactCard, shadows.small]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <View style={styles.compactHeader}>
          <View style={[styles.compactStatus, { backgroundColor: statusConfig.bgColor }]}>
            <Text style={[styles.compactStatusText, { color: statusConfig.color }]}>
              {statusConfig.icon}
            </Text>
          </View>
          <Text style={styles.compactTitle}>Lịch hẹn gặp</Text>
        </View>
        <View style={styles.compactContent}>
          <View style={styles.compactRow}>
            <Icon name="calendar-outline" size={14} color={colors.textMedium} />
            <Text style={styles.compactText}>{formatDateTime(appointment.appointmentDateTime)}</Text>
          </View>
          {appointment.location && (
            <View style={styles.compactRow}>
              <Icon name="location-outline" size={14} color={colors.textMedium} />
              <Text style={styles.compactText} numberOfLines={1}>
                {appointment.location.name}
              </Text>
            </View>
          )}
        </View>
        <View style={styles.viewDetailsRow}>
          <Text style={styles.viewDetailsText}>Xem chi tiết</Text>
          <Icon name="chevron-forward" size={16} color={colors.primary} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, shadows.medium]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusConfig.bgColor }]}>
          <Text style={[styles.statusText, { color: statusConfig.color }]}>
            {statusConfig.icon} {statusConfig.label}
          </Text>
        </View>
        <View style={styles.activityBadge}>
          <Text style={styles.activityIcon}>{activityType?.icon || '🎾'}</Text>
        </View>
      </View>

      {/* Pets */}
      <View style={styles.petsRow}>
        <View style={styles.petInfo}>
          <Icon name="paw" size={20} color={colors.primary} />
          <Text style={styles.petName}>{appointment.inviterPetName}</Text>
        </View>
        <Icon name="heart" size={16} color={colors.error} />
        <View style={styles.petInfo}>
          <Icon name="paw" size={20} color={colors.primaryLight} />
          <Text style={styles.petName}>{appointment.inviteePetName}</Text>
        </View>
      </View>

      {/* Date/Time */}
      <View style={styles.infoRow}>
        <Icon name="calendar" size={16} color={colors.textMedium} />
        <Text style={styles.infoText}>{formatDateTime(appointment.appointmentDateTime)}</Text>
      </View>

      {/* Location */}
      {appointment.location && (
        <View style={styles.infoRow}>
          <Icon name="location" size={16} color={colors.textMedium} />
          <Text style={styles.infoText} numberOfLines={1}>
            {appointment.location.name}
          </Text>
        </View>
      )}

      {/* Activity */}
      <View style={styles.infoRow}>
        <Text style={styles.activityIconSmall}>{activityType?.icon}</Text>
        <Text style={styles.infoText}>{activityType?.label || appointment.activityType}</Text>
      </View>

      {/* Check-in status */}
      {(appointment.status === 'confirmed' || appointment.status === 'on_going') && (
        <View style={styles.checkInRow}>
          <Icon
            name={appointment.inviterCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={appointment.inviterCheckedIn ? colors.success : colors.border}
          />
          <Icon
            name={appointment.inviteeCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
            size={14}
            color={appointment.inviteeCheckedIn ? colors.success : colors.border}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  // Full Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 16,
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.whiteWarm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityIcon: {
    fontSize: 18,
  },
  petsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
  },
  petInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  petName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textDark,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMedium,
    flex: 1,
  },
  activityIconSmall: {
    fontSize: 16,
  },
  checkInRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },

  // Compact Card Styles
  compactCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: 12,
    marginVertical: 4,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  compactStatus: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactStatusText: {
    fontSize: 14,
  },
  compactTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textDark,
  },
  compactContent: {
    gap: 6,
    marginBottom: 8,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactText: {
    fontSize: 12,
    color: colors.textMedium,
    flex: 1,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});

export default AppointmentCard;
