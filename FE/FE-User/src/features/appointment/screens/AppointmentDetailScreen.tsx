/**
 * Appointment Detail Screen
 * Shows appointment details and available actions
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import {
  fetchAppointmentById,
  respondToAppointment,
  cancelAppointment,
  checkInAppointment,
  completeAppointment,
  selectCurrentAppointment,
  selectIsResponding,
  selectIsCancelling,
  selectIsCheckingIn,
  selectIsCompleting,
} from '../appointmentSlice';
import {
  APPOINTMENT_STATUS_CONFIG,
  ACTIVITY_TYPES,
  APPOINTMENT_RULES,
} from '../../../types/appointment.types';
import { colors, gradients, radius, shadows } from '../../../theme';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'AppointmentDetail'>;

const AppointmentDetailScreen = ({ navigation, route }: Props) => {
  const { appointmentId } = route.params;
  const dispatch = useDispatch<AppDispatch>();
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const appointment = useSelector(selectCurrentAppointment);
  const isResponding = useSelector(selectIsResponding);
  const isCancelling = useSelector(selectIsCancelling);
  const isCheckingIn = useSelector(selectIsCheckingIn);
  const isCompleting = useSelector(selectIsCompleting);

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [conflictWarningShown, setConflictWarningShown] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadAppointment();
    }, [appointmentId])
  );

  const loadCurrentUser = async () => {
    const userIdStr = await AsyncStorage.getItem('userId');
    if (userIdStr) setCurrentUserId(parseInt(userIdStr));
  };

  const loadAppointment = async () => {
    setLoading(true);
    await dispatch(fetchAppointmentById(appointmentId));
    setLoading(false);
  };

  const canRespond = () =>
    appointment &&
    currentUserId &&
    appointment.status === 'pending' &&
    appointment.currentDecisionUserId === currentUserId;

  const canCounterOffer = () =>
    canRespond() && appointment!.counterOfferCount < APPOINTMENT_RULES.MAX_COUNTER_OFFERS;

  const canCheckIn = () => {
    if (!appointment || !currentUserId) return false;
    const isParticipant =
      appointment.inviterUserId === currentUserId || appointment.inviteeUserId === currentUserId;
    return isParticipant && ['confirmed', 'on_going'].includes(appointment.status);
  };

  const canCancel = () => {
    if (!appointment || !currentUserId) return false;
    const isParticipant =
      appointment.inviterUserId === currentUserId || appointment.inviteeUserId === currentUserId;
    // Không cho hủy nếu đã cancelled, completed, no_show, hoặc rejected (đã từ chối)
    return isParticipant && !['cancelled', 'completed', 'no_show', 'rejected'].includes(appointment.status);
  };

  const canComplete = () => {
    if (!appointment || !currentUserId) return false;
    const isParticipant =
      appointment.inviterUserId === currentUserId || appointment.inviteeUserId === currentUserId;
    // Chỉ cho kết thúc khi đang diễn ra (cả 2 đã check-in)
    return isParticipant && appointment.status === 'on_going';
  };

  const isUserCheckedIn = () => {
    if (!appointment || !currentUserId) return false;
    return appointment.inviterUserId === currentUserId
      ? appointment.inviterCheckedIn
      : appointment.inviteeCheckedIn;
  };


  const handleAccept = () => {
    // Kiểm tra conflict trước khi accept
    if (appointment?.hasConflict && !conflictWarningShown) {
      setConflictWarningShown(true);
      showAlert({
        type: 'warning',
        title: 'Cảnh báo trùng lịch',
        message: 'Bạn đã có một cuộc hẹn thú cưng khác trong khung giờ này. Hãy cân nhắc khả năng tham gia trước khi xác nhận.\n\nBạn có thể đề xuất thời gian khác hoặc vẫn xác nhận.',
        confirmText: 'Vẫn xác nhận',
        showCancel: true,
        cancelText: 'Đề xuất lại',
        onConfirm: () => {
          // User chọn "Vẫn xác nhận"
          setConflictWarningShown(false);
          hideAlert();
          setTimeout(() => {
            proceedWithAccept();
          }, 350);
        },
        onClose: () => {
          // onClose luôn được gọi, nhưng chỉ navigate nếu user KHÔNG confirm
          // Trick: check nếu vẫn còn conflictWarningShown = true nghĩa là user bấm Cancel
          if (conflictWarningShown) {
            setConflictWarningShown(false);
            setTimeout(() => {
              navigation.navigate('CounterOffer', { appointmentId });
            }, 100);
          }
        },
      });
      return;
    }

    // Reset flag
    setConflictWarningShown(false);

    // Không có conflict hoặc đã xem warning, hiển thị confirm bình thường
    showAlert({
      type: 'warning',
      title: 'Xác nhận cuộc hẹn',
      message: 'Bạn có chắc chắn muốn chấp nhận?',
      confirmText: 'Chấp nhận',
      showCancel: true,
      cancelText: 'Hủy',
      onConfirm: () => {
        hideAlert();
        setTimeout(() => {
          proceedWithAccept();
        }, 350);
      },
    });
  };

  const proceedWithAccept = async () => {
    const result = await dispatch(
      respondToAppointment({ appointmentId, request: { appointmentId, accept: true } })
    );
    if (result.type.endsWith('/fulfilled')) {
      showAlert({
        type: 'success',
        title: 'Thành công',
        message: 'Đã xác nhận',
        confirmText: 'OK',
      });
    } else {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Không thể xác nhận cuộc hẹn. Vui lòng thử lại.',
        confirmText: 'OK',
      });
    }
  };

  const submitDecline = async () => {
    if (!declineReason.trim()) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Vui lòng nhập lý do từ chối',
        confirmText: 'OK',
      });
      return;
    }
    setShowDeclineModal(false);
    const result = await dispatch(
      respondToAppointment({
        appointmentId,
        request: { appointmentId, accept: false, declineReason: declineReason.trim() },
      })
    );
    if (result.type.endsWith('/fulfilled')) {
      showAlert({
        type: 'success',
        title: 'Đã từ chối',
        message: 'Bạn đã từ chối cuộc hẹn',
        confirmText: 'OK',
      });
      setDeclineReason('');
    }
  };

  const handleCancel = () => {
    const appointmentDate = new Date(appointment!.appointmentDateTime);
    const hoursUntil = (appointmentDate.getTime() - Date.now()) / 3600000;
    if (hoursUntil < 2 && hoursUntil > 0) {
      showAlert({
        type: 'warning',
        title: 'Cảnh báo',
        message: 'Cuộc hẹn sắp diễn ra. Bạn có chắc muốn hủy?',
        confirmText: 'Vẫn hủy',
        showCancel: true,
        cancelText: 'Không',
        onConfirm: () => {
          hideAlert();
          setShowCancelModal(true);
        },
      });
    } else {
      setShowCancelModal(true);
    }
  };

  const submitCancel = async () => {
    if (!cancelReason.trim()) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Vui lòng nhập lý do hủy',
        confirmText: 'OK',
      });
      return;
    }
    setShowCancelModal(false);
    const result = await dispatch(
      cancelAppointment({ appointmentId, request: { appointmentId, reason: cancelReason.trim() } })
    );
    if (result.type.endsWith('/fulfilled')) {
      showAlert({
        type: 'success',
        title: 'Đã hủy',
        message: 'Cuộc hẹn đã được hủy',
        confirmText: 'OK',
      });
      setCancelReason('');
    }
  };

  const handleCheckIn = async () => {
    // Validate thời gian check-in
    if (appointment) {
      const appointmentTime = new Date(appointment.appointmentDateTime).getTime();
      const now = Date.now();
      const minCheckInTime = appointmentTime - APPOINTMENT_RULES.CHECK_IN_BEFORE_MINUTES * 60 * 1000;
      const maxCheckInTime = appointmentTime + APPOINTMENT_RULES.CHECK_IN_AFTER_MINUTES * 60 * 1000;

      if (now < minCheckInTime) {
        const minutesUntil = Math.ceil((minCheckInTime - now) / 60000);
        const timeText = minutesUntil >= 60 
          ? `${Math.floor(minutesUntil / 60)} giờ ${minutesUntil % 60} phút`
          : `${minutesUntil} phút`;
        showAlert({
          type: 'warning',
          title: 'Chưa đến giờ',
          message: `Bạn chỉ có thể check-in trước giờ hẹn ${APPOINTMENT_RULES.CHECK_IN_BEFORE_MINUTES} phút. Còn ${timeText} nữa.`,
          confirmText: 'OK',
        });
        return;
      }

      if (now > maxCheckInTime) {
        showAlert({
          type: 'error',
          title: 'Quá giờ',
          message: `Đã quá thời gian check-in. Chỉ được check-in trong vòng ${APPOINTMENT_RULES.CHECK_IN_AFTER_MINUTES} phút sau giờ hẹn.`,
          confirmText: 'OK',
        });
        return;
      }
    }

    const permission =
      Platform.OS === 'ios'
        ? await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE)
        : await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

    if (permission !== RESULTS.GRANTED) {
      showAlert({
        type: 'error',
        title: 'Lỗi',
        message: 'Cần cấp quyền vị trí để check-in',
        confirmText: 'OK',
      });
      return;
    }

    Geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        if (appointment?.location) {
          const dist = calcDistance(
            latitude,
            longitude,
            Number(appointment.location.latitude),
            Number(appointment.location.longitude)
          );
          if (dist > APPOINTMENT_RULES.CHECK_IN_RADIUS_METERS) {
            // Format khoảng cách: >= 1000m thì hiển thị km
            const distText = dist >= 1000 
              ? `${(dist / 1000).toFixed(1)}km` 
              : `${Math.round(dist)}m`;
            const radiusText = APPOINTMENT_RULES.CHECK_IN_RADIUS_METERS >= 1000
              ? `${(APPOINTMENT_RULES.CHECK_IN_RADIUS_METERS / 1000).toFixed(1)}km`
              : `${APPOINTMENT_RULES.CHECK_IN_RADIUS_METERS}m`;
            showAlert({
              type: 'warning',
              title: 'Quá xa',
              message: `Bạn cách ${distText}. Cần trong ${radiusText}.`,
              confirmText: 'OK',
            });
            return;
          }
        }
        const result = await dispatch(
          checkInAppointment({ appointmentId, request: { appointmentId, latitude, longitude } })
        );
        if (result.type.endsWith('/fulfilled')) {
          showAlert({
            type: 'success',
            title: 'Thành công',
            message: 'Check-in thành công',
            confirmText: 'OK',
          });
        }
      },
      (err) => {
        showAlert({
          type: 'error',
          title: 'Lỗi',
          message: err.message,
          confirmText: 'OK',
        });
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleComplete = () => {
    // Validate: chỉ cho kết thúc sau giờ hẹn
    if (appointment) {
      const appointmentTime = new Date(appointment.appointmentDateTime).getTime();
      const now = Date.now();
      
      if (now < appointmentTime) {
        const minutesUntil = Math.ceil((appointmentTime - now) / 60000);
        const timeText = minutesUntil >= 60 
          ? `${Math.floor(minutesUntil / 60)} giờ ${minutesUntil % 60} phút`
          : `${minutesUntil} phút`;
        showAlert({
          type: 'warning',
          title: 'Chưa đến giờ hẹn',
          message: `Bạn chỉ có thể kết thúc cuộc hẹn sau giờ hẹn. Còn ${timeText} nữa mới đến giờ.`,
          confirmText: 'OK',
        });
        return;
      }
    }

    showAlert({
      type: 'warning',
      title: 'Kết thúc cuộc hẹn',
      message: 'Bạn có chắc chắn muốn kết thúc cuộc hẹn này? Đối phương sẽ được thông báo.',
      confirmText: 'Kết thúc',
      showCancel: true,
      cancelText: 'Hủy',
      onConfirm: () => {
        hideAlert();
        setTimeout(async () => {
          const result = await dispatch(completeAppointment(appointmentId));
          if (result.type.endsWith('/fulfilled')) {
            showAlert({
              type: 'success',
              title: 'Hoàn thành',
              message: 'Cuộc hẹn đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ',
              confirmText: 'OK',
            });
          } else {
            showAlert({
              type: 'error',
              title: 'Lỗi',
              message: 'Không thể kết thúc cuộc hẹn. Vui lòng thử lại.',
              confirmText: 'OK',
            });
          }
        }, 350);
      },
    });
  };

  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const openMaps = () => {
    if (!appointment?.location) return;
    const { latitude, longitude, name } = appointment.location;
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(name)}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(name)})`,
    });
    Linking.openURL(url || `https://www.google.com/maps?q=${latitude},${longitude}`);
  };

  const formatDateTime = (str: string) =>
    new Date(str).toLocaleString('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });


  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={styles.center}>
        <Icon name="alert-circle-outline" size={60} color={colors.error} />
        <Text style={styles.errorText}>Không tìm thấy cuộc hẹn</Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const status = APPOINTMENT_STATUS_CONFIG[appointment.status];
  const activity = ACTIVITY_TYPES[appointment.activityType as keyof typeof ACTIVITY_TYPES];

  return (
    <View style={styles.container}>
      <LinearGradient colors={gradients.primary} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết cuộc hẹn</Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status */}
        <View style={[styles.statusBox, { backgroundColor: status.bgColor }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.icon} {status.label}
          </Text>
        </View>

        {/* Pets */}
        <View style={[styles.card, shadows.small]}>
          <Text style={styles.cardTitle}>Thú cưng tham gia</Text>
          <View style={styles.petsRow}>
            <View style={styles.petItem}>
              <Icon name="paw" size={28} color={colors.primary} />
              <Text style={styles.petName}>{appointment.inviterPetName}</Text>
            </View>
            <Icon name="heart" size={20} color={colors.error} />
            <View style={styles.petItem}>
              <Icon name="paw" size={28} color={colors.chatStart} />
              <Text style={styles.petName}>{appointment.inviteePetName}</Text>
            </View>
          </View>
        </View>

        {/* DateTime */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.row}>
            <Icon name="calendar" size={20} color={colors.primary} />
            <Text style={styles.label}>Thời gian</Text>
          </View>
          <Text style={styles.value}>{formatDateTime(appointment.appointmentDateTime)}</Text>
        </View>

        {/* Activity */}
        <View style={[styles.card, shadows.small]}>
          <View style={styles.row}>
            <Text style={{ fontSize: 20 }}>{activity?.icon || '🎾'}</Text>
            <Text style={styles.label}>Hoạt động</Text>
          </View>
          <Text style={styles.value}>{activity?.label || appointment.activityType}</Text>
          {activity?.description && <Text style={styles.desc}>{activity.description}</Text>}
        </View>

        {/* Location with Map */}
        {appointment.location && (
          <View style={[styles.card, shadows.small]}>
            <View style={styles.row}>
              <Icon name="location" size={20} color={colors.primary} />
              <Text style={styles.label}>Địa điểm</Text>
            </View>
            <Text style={styles.locName}>{appointment.location.name}</Text>
            <Text style={styles.locAddr}>{appointment.location.address}</Text>
            {(appointment.location.district || appointment.location.city) && (
              <View style={styles.locMeta}>
                {appointment.location.district && (
                  <View style={styles.tag}>
                    <Icon name="business-outline" size={12} color={colors.textMedium} />
                    <Text style={styles.tagText}>{appointment.location.district}</Text>
                  </View>
                )}
                {appointment.location.city && (
                  <View style={styles.tag}>
                    <Icon name="map-outline" size={12} color={colors.textMedium} />
                    <Text style={styles.tagText}>{appointment.location.city}</Text>
                  </View>
                )}
                {appointment.location.isPetFriendly && (
                  <View style={[styles.tag, { backgroundColor: colors.success + '20' }]}>
                    <Icon name="paw" size={12} color={colors.success} />
                    <Text style={[styles.tagText, { color: colors.success }]}>Pet Friendly</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.mapBox}>
              <MapView
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                  latitude: Number(appointment.location.latitude),
                  longitude: Number(appointment.location.longitude),
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: Number(appointment.location.latitude),
                    longitude: Number(appointment.location.longitude),
                  }}
                />
              </MapView>
              <TouchableOpacity style={styles.mapBtn} onPress={openMaps}>
                <LinearGradient colors={[colors.primary, colors.chatStart]} style={styles.mapBtnGrad}>
                  <Icon name="navigate" size={16} color={colors.white} />
                  <Text style={styles.mapBtnText}>Chỉ đường</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}


        {/* Check-in Status */}
        {['confirmed', 'on_going'].includes(appointment.status) && (
          <View style={[styles.card, shadows.small]}>
            <Text style={styles.cardTitle}>Trạng thái Check-in</Text>
            <View style={styles.checkRow}>
              <View style={styles.checkItem}>
                <Icon
                  name={appointment.inviterCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={appointment.inviterCheckedIn ? colors.success : colors.border}
                />
                <Text style={styles.checkName}>{appointment.inviterPetName}</Text>
              </View>
              <View style={styles.checkItem}>
                <Icon
                  name={appointment.inviteeCheckedIn ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={appointment.inviteeCheckedIn ? colors.success : colors.border}
                />
                <Text style={styles.checkName}>{appointment.inviteePetName}</Text>
              </View>
            </View>
            {/* Thông báo khi cả 2 đã check-in */}
            {appointment.inviterCheckedIn && appointment.inviteeCheckedIn && (
              <View style={styles.bothCheckedInBanner}>
                <Text style={styles.bothCheckedInText}>
                  🎉 Cả hai đã có mặt! Chúc các bạn có buổi hẹn vui vẻ!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Counter Offer Info */}
        {appointment.status === 'pending' && appointment.counterOfferCount > 0 && (
          <View style={[styles.card, shadows.small]}>
            <Text style={styles.label}>
              Đã đề xuất lại: {appointment.counterOfferCount}/{APPOINTMENT_RULES.MAX_COUNTER_OFFERS} lần
            </Text>
          </View>
        )}

        {/* Cancel/Reject Reason */}
        {(appointment.status === 'cancelled' || appointment.status === 'rejected') && appointment.cancelReason && (
          <View style={[styles.card, shadows.small]}>
            <Text style={styles.cardTitle}>
              {appointment.status === 'rejected' ? 'Lý do từ chối' : 'Lý do hủy'}
            </Text>
            <Text style={styles.value}>{appointment.cancelReason}</Text>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {canRespond() && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={handleAccept}
                disabled={isResponding}
              >
                {isResponding ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Icon name="checkmark-circle" size={20} color={colors.white} />
                    <Text style={styles.actionText}>Chấp nhận</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.error }]}
                onPress={() => setShowDeclineModal(true)}
              >
                <Icon name="close-circle" size={20} color={colors.white} />
                <Text style={styles.actionText}>Từ chối</Text>
              </TouchableOpacity>
            </>
          )}
          {canCounterOffer() && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.warning }]}
              onPress={() => navigation.navigate('CounterOffer', { appointmentId })}
            >
              <Icon name="swap-horizontal" size={20} color={colors.white} />
              <Text style={styles.actionText}>Đề xuất lại</Text>
            </TouchableOpacity>
          )}
          {canCheckIn() && !isUserCheckedIn() && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.male }]}
              onPress={handleCheckIn}
              disabled={isCheckingIn}
            >
              {isCheckingIn ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Icon name="location" size={20} color={colors.white} />
                  <Text style={styles.actionText}>Check-in</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canComplete() && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={handleComplete}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Icon name="checkmark-done" size={20} color={colors.white} />
                  <Text style={styles.actionText}>Kết thúc cuộc hẹn</Text>
                </>
              )}
            </TouchableOpacity>
          )}
          {canCancel() && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.textMedium }]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <Icon name="trash" size={20} color={colors.white} />
                  <Text style={styles.actionText}>Hủy cuộc hẹn</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Decline Modal */}
      <Modal visible={showDeclineModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, shadows.large]}>
            <Text style={styles.modalTitle}>Lý do từ chối</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lý do..."
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.bgGradientStart }]}
                onPress={() => {
                  setShowDeclineModal(false);
                  setDeclineReason('');
                }}
              >
                <Text style={{ color: colors.textDark }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={submitDecline}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cancel Modal */}
      <Modal visible={showCancelModal} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalBox, shadows.large]}>
            <Text style={styles.modalTitle}>Lý do hủy cuộc hẹn</Text>
            <TextInput
              style={styles.input}
              placeholder="Nhập lý do..."
              value={cancelReason}
              onChangeText={setCancelReason}
              multiline
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.bgGradientStart }]}
                onPress={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
              >
                <Text style={{ color: colors.textDark }}>Không</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: colors.error }]}
                onPress={submitCancel}
              >
                <Text style={{ color: colors.white, fontWeight: '700' }}>Hủy cuộc hẹn</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
          onClose={hideAlert}
          onConfirm={alertConfig.onConfirm}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgGradientStart },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgGradientStart },
  loadingText: { marginTop: 12, color: colors.textMedium },
  errorText: { fontSize: 18, color: colors.textDark, marginVertical: 16 },
  btn: { backgroundColor: colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: radius.md },
  btnText: { color: colors.white, fontWeight: '700' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: colors.white },
  content: { flex: 1, padding: 16 },
  statusBox: { padding: 14, borderRadius: radius.lg, alignItems: 'center', marginBottom: 12 },
  statusText: { fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 14, marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textDark, marginBottom: 10 },
  petsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  petItem: { alignItems: 'center', gap: 4 },
  petName: { fontSize: 14, fontWeight: '600', color: colors.textDark },
  ownerName: { fontSize: 11, color: colors.textMedium },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMedium },
  value: { fontSize: 15, color: colors.textDark },
  desc: { fontSize: 12, color: colors.textMedium, marginTop: 4 },
  locName: { fontSize: 16, fontWeight: '700', color: colors.textDark, marginBottom: 2 },
  locAddr: { fontSize: 13, color: colors.textMedium },
  locMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgGradientStart,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  tagText: { fontSize: 11, color: colors.textMedium },
  mapBox: { marginTop: 10, height: 160, borderRadius: radius.md, overflow: 'hidden' },
  mapBtn: { position: 'absolute', bottom: 10, right: 10, borderRadius: radius.md, overflow: 'hidden' },
  mapBtnGrad: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8 },
  mapBtnText: { fontSize: 13, fontWeight: '600', color: colors.white },
  checkRow: { flexDirection: 'row', justifyContent: 'space-around' },
  checkItem: { alignItems: 'center', gap: 6 },
  checkName: { fontSize: 13, fontWeight: '600', color: colors.textDark },
  bothCheckedInBanner: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.success + '15',
    borderRadius: radius.md,
    alignItems: 'center',
  },
  bothCheckedInText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
    textAlign: 'center',
  },
  actions: { gap: 10, marginTop: 8 },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 14,
    borderRadius: radius.lg,
  },
  actionText: { fontSize: 15, fontWeight: '700', color: colors.white },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: colors.white, borderRadius: radius.lg, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: colors.textDark, marginBottom: 12, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 12,
    minHeight: 80,
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  modalBtns: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: radius.md, alignItems: 'center' },
});

export default AppointmentDetailScreen;
