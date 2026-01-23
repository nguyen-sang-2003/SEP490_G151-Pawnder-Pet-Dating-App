/**
 * Create Appointment Screen
 * Tạo lịch hẹn gặp gỡ thú cưng - UI chuyên nghiệp
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import {
  createAppointment,
  validatePreconditions,
  selectIsCreating,
  selectValidationError,
  selectValidationChecked,
  clearValidation,
  selectSelectedLocation,
  clearSelectedLocation,
} from '../appointmentSlice';
import {
  ActivityType,
  ACTIVITY_TYPES,
  APPOINTMENT_RULES,
  CreateAppointmentRequest,
} from '../../../types/appointment.types';
import { colors, gradients, radius, shadows } from '../../../theme';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAppointment'>;

// Activity icons với hình ảnh đẹp hơn
const ACTIVITY_ICONS: Record<ActivityType, { icon: string; color: string; bgColor: string }> = {
  walk: { icon: 'walk', color: '#4CAF50', bgColor: '#E8F5E9' },
  cafe: { icon: 'cafe', color: '#795548', bgColor: '#EFEBE9' },
  playdate: { icon: 'game-controller', color: '#2196F3', bgColor: '#E3F2FD' },
};

const CreateAppointmentScreen = ({ navigation, route }: Props) => {
  const { matchId, inviterPetId, inviteePetId, inviterPetName, inviteePetName } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const isCreating = useSelector(selectIsCreating);
  const validationError = useSelector(selectValidationError);
  const validationChecked = useSelector(selectValidationChecked);
  const selectedLocation = useSelector(selectSelectedLocation);

  // Form state
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + APPOINTMENT_RULES.MIN_HOURS_ADVANCE + 1);
    date.setMinutes(0);
    return date;
  });
  const [selectedTime, setSelectedTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + APPOINTMENT_RULES.MIN_HOURS_ADVANCE + 1);
    date.setMinutes(0);
    return date;
  });
  const [activityType, setActivityType] = useState<ActivityType>('cafe');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Computed values
  const locationName = selectedLocation?.type === 'PRESET'
    ? selectedLocation.location?.name
    : selectedLocation?.type === 'CUSTOM'
      ? selectedLocation.customLocation.name
      : null;

  const locationAddress = selectedLocation?.type === 'PRESET'
    ? selectedLocation.location?.address
    : selectedLocation?.type === 'CUSTOM'
      ? selectedLocation.customLocation.address
      : null;

  const locationCoord = selectedLocation?.type === 'PRESET' && selectedLocation.location
    ? { latitude: selectedLocation.location.latitude, longitude: selectedLocation.location.longitude }
    : selectedLocation?.type === 'CUSTOM'
      ? { latitude: selectedLocation.customLocation.latitude, longitude: selectedLocation.customLocation.longitude }
      : null;

  useEffect(() => {
    dispatch(validatePreconditions({ matchId, inviterPetId, inviteePetId }));
    return () => {
      dispatch(clearValidation());
      dispatch(clearSelectedLocation());
    };
  }, [dispatch, matchId, inviterPetId, inviteePetId]);

  useEffect(() => {
    if (validationChecked && validationError) {
      showAlert({
        type: 'error',
        title: 'Không thể tạo lịch hẹn',
        message: validationError,
        confirmText: 'Đã hiểu',
      });
    }
  }, [validationChecked, validationError]);

  const handleAlertClose = () => {
    hideAlert();
    if (validationError) {
      navigation.goBack();
    }
  };

  const handleDateChange = (_: any, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setSelectedDate(date);
  };

  const handleTimeChange = (_: any, time?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (time) setSelectedTime(time);
  };

  const isDateTimeValid = (): boolean => {
    const dt = new Date(selectedDate);
    dt.setHours(selectedTime.getHours(), selectedTime.getMinutes());
    const minDt = new Date();
    minDt.setHours(minDt.getHours() + APPOINTMENT_RULES.MIN_HOURS_ADVANCE);
    return dt >= minDt;
  };

  const handleCreate = async () => {
    if (!isDateTimeValid()) {
      showAlert({
        type: 'warning',
        title: 'Thời gian không hợp lệ',
        message: `Thời gian hẹn phải cách hiện tại ít nhất ${APPOINTMENT_RULES.MIN_HOURS_ADVANCE} giờ`,
      });
      return;
    }

    if (!selectedLocation) {
      showAlert({
        type: 'warning',
        title: 'Thiếu địa điểm',
        message: 'Vui lòng chọn địa điểm để gặp gỡ',
      });
      return;
    }

    const appointmentDateTime = new Date(selectedDate);
    appointmentDateTime.setHours(selectedTime.getHours(), selectedTime.getMinutes());

    const request: CreateAppointmentRequest = {
      matchId,
      inviterPetId,
      inviteePetId,
      appointmentDateTime: appointmentDateTime.toISOString(),
      activityType,
      ...(selectedLocation.type === 'PRESET' && { locationId: selectedLocation.locationId }),
      ...(selectedLocation.type === 'CUSTOM' && { customLocation: selectedLocation.customLocation }),
    };

    try {
      const result = await dispatch(createAppointment(request));

      if (result.type.endsWith('/fulfilled')) {
        const created = (result as any).payload;
        showAlert({
          type: 'success',
          title: 'Gửi lời mời thành công',
          message: `Lời mời đã được gửi đến chủ của ${inviteePetName}. Bạn sẽ nhận thông báo khi họ phản hồi.`,
          confirmText: 'Xem chi tiết',
          onConfirm: () => {
            hideAlert();
            navigation.replace('AppointmentDetail', { appointmentId: created.appointmentId });
          },
          onClose: () => {
            // Khi đóng alert (không bấm "Xem chi tiết"), navigate về Appointments
            hideAlert();
            navigation.navigate('MyAppointments');
          },
        });
      } else {
        showAlert({
          type: 'error',
          title: 'Không thể tạo lịch hẹn',
          message: (result as any).payload || 'Đã có lỗi xảy ra. Vui lòng thử lại.',
        });
      }
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: error?.message || 'Đã có lỗi xảy ra',
      });
    }
  };

  const formatDate = (date: Date) => {
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return `${days[date.getDay()]}, ${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const formatTime = (time: Date) =>
    `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

  if (!validationChecked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang kiểm tra...</Text>
        {alertConfig && (
          <CustomAlert visible={visible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} confirmText={alertConfig.confirmText} onClose={handleAlertClose} />
        )}
      </View>
    );
  }

  if (validationError) {
    return (
      <View style={styles.loadingContainer}>
        {alertConfig && (
          <CustomAlert visible={visible} type={alertConfig.type} title={alertConfig.title} message={alertConfig.message} confirmText={alertConfig.confirmText} onClose={handleAlertClose} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.chat} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tạo lịch hẹn</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pet Match Card*/}
        <View style={styles.matchCard}>
          <View style={styles.matchContent}>
            <View style={styles.petInfo}>
              <View style={[styles.petAvatar, { backgroundColor: '#FFE4EC' }]}>
                <Icon name="paw" size={28} color={colors.primary} />
              </View>
              <Text style={styles.petName} numberOfLines={1}>{inviterPetName}</Text>
              <Text style={styles.petRole}>Bé nhà bạn</Text>
            </View>

            <View style={styles.matchIcon}>
              <LinearGradient colors={['#FF6B6B', '#FF8E8E']} style={styles.heartGradient}>
                <Icon name="heart" size={18} color={colors.white} />
              </LinearGradient>
              <Text style={styles.matchText}>muốn gặp</Text>
            </View>

            <View style={styles.petInfo}>
              <View style={[styles.petAvatar, { backgroundColor: '#E8F4FD' }]}>
                <Icon name="paw" size={28} color="#2196F3" />
              </View>
              <Text style={styles.petName} numberOfLines={1}>{inviteePetName}</Text>
              <Text style={styles.petRole}>Bé đối phương</Text>
            </View>
          </View>
        </View>

        {/* Activity Type - Card style */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chọn hoạt động</Text>
          <View style={styles.activityList}>
            {(Object.keys(ACTIVITY_TYPES) as ActivityType[]).map((type) => {
              const activity = ACTIVITY_TYPES[type];
              const iconConfig = ACTIVITY_ICONS[type];
              const isSelected = activityType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.activityItem, isSelected && styles.activityItemSelected]}
                  onPress={() => setActivityType(type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.activityIconBox, { backgroundColor: iconConfig.bgColor }]}>
                    <Icon name={iconConfig.icon} size={24} color={iconConfig.color} />
                  </View>
                  <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                    {activity.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.checkMark}>
                      <Icon name="checkmark-circle" size={22} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <View style={styles.dateTimeRow}>
            <TouchableOpacity style={styles.dateTimeBox} onPress={() => setShowDatePicker(true)}>
              <View style={[styles.dateTimeIconBox, { backgroundColor: '#FFF3E0' }]}>
                <Icon name="calendar" size={20} color="#FF9800" />
              </View>
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Ngày hẹn</Text>
                <Text style={styles.dateTimeValue}>{formatDate(selectedDate)}</Text>
              </View>
              <Icon name="chevron-down" size={18} color={colors.textLight} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.dateTimeBox} onPress={() => setShowTimePicker(true)}>
              <View style={[styles.dateTimeIconBox, { backgroundColor: '#E8F5E9' }]}>
                <Icon name="time" size={20} color="#4CAF50" />
              </View>
              <View style={styles.dateTimeContent}>
                <Text style={styles.dateTimeLabel}>Giờ hẹn</Text>
                <Text style={styles.dateTimeValue}>{formatTime(selectedTime)}</Text>
              </View>
              <Icon name="chevron-down" size={18} color={colors.textLight} />
            </TouchableOpacity>
          </View>
          <View style={styles.hintBox}>
            <Icon name="information-circle" size={14} color={colors.textLight} />
            <Text style={styles.hintText}>
              Đặt lịch trước ít nhất {APPOINTMENT_RULES.MIN_HOURS_ADVANCE} giờ
            </Text>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} minimumDate={new Date()} />
        )}
        {showTimePicker && (
          <DateTimePicker value={selectedTime} mode="time" display="default" onChange={handleTimeChange} is24Hour />
        )}

        {/* Location*/}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Địa điểm gặp gỡ</Text>
          <TouchableOpacity
            style={styles.locationBox}
            onPress={() => navigation.navigate('LocationPicker')}
            activeOpacity={0.7}
          >
            {selectedLocation ? (
              <View style={styles.locationSelected}>
                <View style={styles.locationInfo}>
                  <View style={[styles.locationIconBox, { backgroundColor: '#E8F5E9' }]}>
                    <Icon name="location" size={22} color="#4CAF50" />
                  </View>
                  <View style={styles.locationText}>
                    <Text style={styles.locationName} numberOfLines={1}>{locationName}</Text>
                    <Text style={styles.locationAddress} numberOfLines={2}>{locationAddress}</Text>
                  </View>
                  <TouchableOpacity style={styles.changeBtn}>
                    <Text style={styles.changeBtnText}>Đổi</Text>
                  </TouchableOpacity>
                </View>
                {locationCoord && (
                  <View style={styles.mapPreview}>
                    <MapView
                      style={StyleSheet.absoluteFillObject}
                      initialRegion={{ ...locationCoord, latitudeDelta: 0.008, longitudeDelta: 0.008 }}
                      scrollEnabled={false}
                      zoomEnabled={false}
                      pitchEnabled={false}
                      rotateEnabled={false}
                      pointerEvents="none"
                    >
                      <Marker coordinate={locationCoord} />
                    </MapView>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.locationEmpty}>
                <View style={[styles.locationIconBox, { backgroundColor: colors.primary + '15' }]}>
                  <Icon name="add" size={24} color={colors.primary} />
                </View>
                <View style={styles.locationText}>
                  <Text style={styles.locationPlaceholder}>Chọn địa điểm hẹn</Text>
                  <Text style={styles.locationHint}>Nhấn để chọn trên bản đồ</Text>
                </View>
                <Icon name="chevron-forward" size={20} color={colors.textLight} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, (!selectedLocation || isCreating) && styles.submitBtnDisabled]}
          onPress={handleCreate}
          disabled={isCreating || !selectedLocation}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={selectedLocation ? gradients.chat : ['#CCC', '#BBB']}
            style={styles.submitGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isCreating ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon name="send" size={20} color={colors.white} />
                <Text style={styles.submitText}>Gửi lời mời hẹn</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          confirmText={alertConfig.confirmText}
          cancelText={alertConfig.cancelText}
          showCancel={alertConfig.showCancel}
          onClose={handleAlertClose}
          onConfirm={alertConfig.onConfirm}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMedium,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 44,
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
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },

  // Content
  content: {
    flex: 1,
  },

  // Match Card
  matchCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    ...shadows.medium,
  },
  matchContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  petInfo: {
    alignItems: 'center',
    flex: 1,
  },
  petAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  petName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textDark,
    textAlign: 'center',
  },
  petRole: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  matchIcon: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  heartGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchText: {
    fontSize: 11,
    color: colors.textLight,
    marginTop: 6,
  },

  // Section
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textDark,
    marginBottom: 12,
  },

  // Activity
  activityList: {
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  activityIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginLeft: 14,
  },
  activityNameSelected: {
    color: colors.primary,
  },
  checkMark: {
    marginLeft: 8,
  },

  // DateTime
  dateTimeRow: {
    gap: 12,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
  },
  dateTimeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateTimeContent: {
    flex: 1,
    marginLeft: 12,
  },
  dateTimeLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 2,
  },
  dateTimeValue: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 4,
  },
  hintText: {
    fontSize: 12,
    color: colors.textLight,
  },

  // Location
  locationBox: {
    backgroundColor: colors.white,
    borderRadius: 14,
    overflow: 'hidden',
  },
  locationSelected: {},
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  locationEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  locationIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationText: {
    flex: 1,
    marginLeft: 12,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textMedium,
    marginTop: 2,
    lineHeight: 18,
  },
  locationPlaceholder: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMedium,
  },
  locationHint: {
    fontSize: 13,
    color: colors.textLight,
    marginTop: 2,
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
  },
  changeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  mapPreview: {
    height: 140,
    backgroundColor: '#E8E8E8',
  },
  customMarker: {
    backgroundColor: colors.white,
    padding: 6,
    borderRadius: 20,
    ...shadows.small,
  },

  // Submit
  submitBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.medium,
  },
  submitBtnDisabled: {
    opacity: 0.7,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CreateAppointmentScreen;
