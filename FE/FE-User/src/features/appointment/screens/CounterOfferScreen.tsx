/**
 * Counter Offer Screen
 * Allow users to propose new time/location for appointment
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import {
  fetchAppointmentById,
  counterOfferAppointment,
  selectCurrentAppointment,
  selectIsCounterOffering,
} from '../appointmentSlice';
import { CounterOfferRequest, APPOINTMENT_RULES } from '../../../types/appointment.types';
import { LocationSelectionResult } from '../../../types/location.types';
import { colors, gradients, radius, shadows } from '../../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'CounterOffer'>;

const CounterOfferScreen = ({ navigation, route }: Props) => {
  const { appointmentId } = route.params;
  const dispatch = useDispatch<AppDispatch>();

  const appointment = useSelector(selectCurrentAppointment);
  const isCounterOffering = useSelector(selectIsCounterOffering);

  const [loading, setLoading] = useState(true);
  const [changeDate, setChangeDate] = useState(false);
  const [changeLocation, setChangeLocation] = useState(false);

  // New date/time state
  const [newDate, setNewDate] = useState<Date | null>(null);
  const [newTime, setNewTime] = useState<Date | null>(null);
  const [newLocation, setNewLocation] = useState<LocationSelectionResult | null>(null);

  const newLocationName =
    newLocation?.type === 'PRESET'
      ? newLocation.location?.name || `Dia diem #${newLocation.locationId}`
      : newLocation?.type === 'CUSTOM'
        ? newLocation.customLocation.name
        : '';

  const newLocationAddress =
    newLocation?.type === 'PRESET'
      ? newLocation.location?.address
      : newLocation?.type === 'CUSTOM'
        ? newLocation.customLocation.address
        : '';

  // Date/Time picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Load appointment
  useEffect(() => {
    loadAppointment();
  }, []);

  const loadAppointment = async () => {
    setLoading(true);
    await dispatch(fetchAppointmentById(appointmentId));
    setLoading(false);
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) {
      setNewDate(date);
    }
  };

  const handleTimeChange = (event: any, time?: Date) => {
    setShowTimePicker(Platform.OS === 'ios');
    if (time) {
      setNewTime(time);
    }
  };

  const handleLocationSelect = () => {
    navigation.navigate('LocationPicker', {
      onSelect: (location: any) => {
        setNewLocation(location);
      },
    });
  };

  const isDateTimeValid = (): boolean => {
    if (!changeDate || !newDate || !newTime) return true;

    const appointmentDateTime = new Date(newDate);
    appointmentDateTime.setHours(newTime.getHours());
    appointmentDateTime.setMinutes(newTime.getMinutes());

    const minDateTime = new Date();
    minDateTime.setHours(minDateTime.getHours() + APPOINTMENT_RULES.MIN_HOURS_ADVANCE);

    return appointmentDateTime >= minDateTime;
  };

  const handleSubmit = async () => {
    // Validate
    if (changeDate && (!newDate || !newTime)) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày và giờ mới');
      return;
    }

    if (changeLocation && !newLocation) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn địa điểm mới');
      return;
    }

    if (!changeDate && !changeLocation) {
      Alert.alert('Chưa chọn', 'Vui lòng chọn ít nhất một thông tin để đề xuất lại');
      return;
    }

    if (changeDate && !isDateTimeValid()) {
      Alert.alert(
        'Thời gian không hợp lệ',
        `Thời gian hẹn phải cách hiện tại ít nhất ${APPOINTMENT_RULES.MIN_HOURS_ADVANCE} giờ`
      );
      return;
    }

    // Build request
    const request: CounterOfferRequest = {
      appointmentId,
    };

    if (changeDate && newDate && newTime) {
      const appointmentDateTime = new Date(newDate);
      appointmentDateTime.setHours(newTime.getHours());
      appointmentDateTime.setMinutes(newTime.getMinutes());
      request.newDateTime = appointmentDateTime.toISOString();
    }

    if (changeLocation && newLocation) {
      if (newLocation.type === 'PRESET') {
        request.newLocationId = newLocation.locationId;
      } else if (newLocation.type === 'CUSTOM') {
        request.newCustomLocation = newLocation.customLocation;
      }
    }

    const result = await dispatch(counterOfferAppointment({ appointmentId, request }));

    if (result.type.endsWith('/fulfilled')) {
      Alert.alert('Đã gửi', 'Đề xuất mới đã được gửi! Đợi đối phương phản hồi nhé 📝', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } else {
      Alert.alert('Lỗi', 'Không thể gửi đề xuất. Vui lòng thử lại.');
    }
  };

  // Format date/time
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy cuộc hẹn</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const counterOffersLeft =
    APPOINTMENT_RULES.MAX_COUNTER_OFFERS - (appointment.counterOfferCount || 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đề xuất lại</Text>
        <View style={styles.backButton} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Counter Offer Info */}
        <View style={[styles.infoCard, shadows.small]}>
          <Icon name="information-circle" size={24} color={colors.info} />
          <Text style={styles.infoText}>
            Bạn có thể đề xuất lại thời gian hoặc địa điểm cho cuộc hẹn này. Còn lại{' '}
            <Text style={styles.infoHighlight}>{counterOffersLeft}</Text> lần đề xuất.
          </Text>
        </View>

        {/* Current Info */}
        <View style={[styles.section, shadows.small]}>
          <Text style={styles.sectionTitle}>Thông tin hiện tại</Text>
          <View style={styles.currentInfo}>
            <Icon name="calendar" size={16} color={colors.textSecondary} />
            <Text style={styles.currentText}>
              {formatDate(new Date(appointment.appointmentDateTime))} •{' '}
              {formatTime(new Date(appointment.appointmentDateTime))}
            </Text>
          </View>
          {appointment.location && (
            <View style={styles.currentInfo}>
              <Icon name="location" size={16} color={colors.textSecondary} />
              <Text style={styles.currentText} numberOfLines={2}>
                {appointment.location.name}
              </Text>
            </View>
          )}
        </View>

        {/* Change Date/Time */}
        <View style={[styles.section, shadows.small]}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => {
              setChangeDate(!changeDate);
              if (!changeDate) {
                const date = new Date();
                date.setDate(date.getDate() + 1);
                setNewDate(date);
                setNewTime(date);
              }
            }}
            activeOpacity={0.7}
          >
            <Icon
              name={changeDate ? 'checkbox' : 'square-outline'}
              size={24}
              color={changeDate ? colors.primary : colors.border}
            />
            <Text style={styles.checkboxLabel}>Đổi thời gian</Text>
          </TouchableOpacity>

          {changeDate && (
            <View style={styles.inputsContainer}>
              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Icon name="calendar" size={20} color={colors.primary} />
                <Text style={styles.inputButtonText}>
                  {newDate ? formatDate(newDate) : 'Chọn ngày'}
                </Text>
                <Icon name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.inputButton}
                onPress={() => setShowTimePicker(true)}
                activeOpacity={0.7}
              >
                <Icon name="time" size={20} color={colors.primary} />
                <Text style={styles.inputButtonText}>
                  {newTime ? formatTime(newTime) : 'Chọn giờ'}
                </Text>
                <Icon name="chevron-down" size={20} color={colors.textSecondary} />
              </TouchableOpacity>

              {showDatePicker && newDate && (
                <DateTimePicker
                  value={newDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {showTimePicker && newTime && (
                <DateTimePicker
                  value={newTime}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleTimeChange}
                />
              )}
            </View>
          )}
        </View>

        {/* Change Location */}
        <View style={[styles.section, shadows.small]}>
          <TouchableOpacity
            style={styles.checkboxRow}
            onPress={() => setChangeLocation(!changeLocation)}
            activeOpacity={0.7}
          >
            <Icon
              name={changeLocation ? 'checkbox' : 'square-outline'}
              size={24}
              color={changeLocation ? colors.primary : colors.border}
            />
            <Text style={styles.checkboxLabel}>Đổi địa điểm</Text>
          </TouchableOpacity>

          {changeLocation && (
            <View style={styles.inputsContainer}>
              {newLocation ? (
                <View style={styles.locationSelected}>
                  <View style={styles.locationInfo}>
                    <Icon name="location" size={20} color={colors.primary} />
                    <View style={styles.locationText}>
                      <Text style={styles.locationBadge}>
                        {newLocation.type === 'CUSTOM' ? 'Custom' : 'Goi y'}
                      </Text>
                      <Text style={styles.locationName}>{newLocationName}</Text>
                      <Text style={styles.locationAddress} numberOfLines={2}>
                        {newLocationAddress}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.changeButton}
                    onPress={handleLocationSelect}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.changeButtonText}>Đổi</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.inputButton}
                  onPress={handleLocationSelect}
                  activeOpacity={0.7}
                >
                  <Icon name="location" size={20} color={colors.primary} />
                  <Text style={[styles.inputButtonText, styles.placeholderText]}>
                    Chọn địa điểm mới...
                  </Text>
                  <Icon name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, shadows.medium]}
          onPress={handleSubmit}
          disabled={isCounterOffering}
          activeOpacity={0.8}
        >
          <LinearGradient colors={gradients.primary} style={styles.submitButtonGradient}>
            {isCounterOffering ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Icon name="paper-plane" size={20} color={colors.white} />
                <Text style={styles.submitButtonText}>Gửi đề xuất</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
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
  content: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colors.info + '15',
    borderRadius: radius.large,
    padding: 16,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  infoHighlight: {
    fontWeight: '700',
    color: colors.info,
  },
  section: {
    backgroundColor: colors.white,
    borderRadius: radius.large,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  currentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  currentText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkboxLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  inputsContainer: {
    marginTop: 12,
    gap: 12,
  },
  inputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radius.medium,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  inputButtonText: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textSecondary,
  },
  locationSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  locationInfo: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
  },
  locationText: {
    flex: 1,
  },
  locationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '20',
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.small,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  changeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.small,
    backgroundColor: colors.primary + '20',
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  submitButton: {
    borderRadius: radius.large,
    overflow: 'hidden',
    marginVertical: 16,
    marginBottom: 30,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: radius.medium,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

export default CounterOfferScreen;
