/**
 * Location Picker Screen
 * Chọn địa điểm cho cuộc hẹn - Giao diện tối ưu
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import {
  fetchSuggestedLocations,
  selectLocations,
  selectLocationsLoading,
  setSelectedLocation,
} from '../appointmentSlice';
import { LocationResponse } from '../../../types/appointment.types';
import { LocationSelectionResult } from '../../../types/location.types';
import {
  ensureLocationPermission,
  getCurrentLocation,
} from '../../../services/location.service';
import { colors, gradients, radius, shadows } from '../../../theme';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationPicker'>;

const LocationPickerScreen = ({ navigation, route }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const locations = useSelector(selectLocations);
  const locationsLoading = useSelector(selectLocationsLoading);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const [cityQuery, setCityQuery] = useState(route.params?.city || '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    loadNearbySuggestions();
  }, []);

  const loadNearbySuggestions = async () => {
    setStatusMessage(null);

    try {
      const permission = await ensureLocationPermission();

      if (!permission.granted) {
        setStatusMessage('Đang tải địa điểm tại Hồ Chí Minh...');
        await dispatch(fetchSuggestedLocations({ city: 'Ho Chi Minh' })).unwrap();
        setStatusMessage('Bật định vị để xem địa điểm gần bạn');
        return;
      }

      setStatusMessage('Đang lấy vị trí của bạn...');
      const coords = await getCurrentLocation();

      setStatusMessage('Đang tìm địa điểm gần bạn...');
      await dispatch(
        fetchSuggestedLocations({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      ).unwrap();
      setStatusMessage(null);
    } catch (error: any) {
      setStatusMessage('Nhập tên thành phố để tìm địa điểm');
      try {
        await dispatch(fetchSuggestedLocations({ city: 'Ho Chi Minh' })).unwrap();
      } catch {
        // Silent fail
      }
    }
  };

  const searchByCity = async () => {
    if (!cityQuery.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu thông tin',
        message: 'Vui lòng nhập tên thành phố để tìm kiếm',
      });
      return;
    }

    setStatusMessage('Đang tìm kiếm...');
    try {
      await dispatch(fetchSuggestedLocations({ city: cityQuery.trim() })).unwrap();
      setStatusMessage(null);
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Không tìm thấy',
        message: 'Không tìm thấy địa điểm nào. Thử tên thành phố khác hoặc chọn trên bản đồ.',
      });
      setStatusMessage(null);
    }
  };

  const handleSelectLocation = (location: LocationResponse) => {
    const selection: LocationSelectionResult = {
      type: 'PRESET',
      locationId: location.locationId,
      location,
    };

    dispatch(setSelectedLocation(selection));
    route.params?.onSelect?.(selection);
    navigation.goBack();
  };

  const handleOpenMap = () => {
    navigation.navigate('MapPicker', {
      city: cityQuery,
      onSelect: (selection) => {
        route.params?.onSelect?.(selection);
        navigation.goBack();
      },
    });
  };

  const renderLocationItem = ({ item }: { item: LocationResponse }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Icon name="location" size={20} color={colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
        <View style={styles.locationTags}>
          {item.city && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.city}</Text>
            </View>
          )}
          {item.isPetFriendly && (
            <View style={[styles.tag, styles.tagPetFriendly]}>
              <Icon name="paw" size={10} color={colors.success} />
              <Text style={[styles.tagText, { color: colors.success }]}>Pet Friendly</Text>
            </View>
          )}
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.textLight} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.chat} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="close" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn địa điểm</Text>
        <View style={styles.headerBtn} />
      </LinearGradient>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color={colors.textLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nhập tên thành phố (VD: Hà Nội, Đà Nẵng...)"
            placeholderTextColor={colors.textLight}
            value={cityQuery}
            onChangeText={setCityQuery}
            onSubmitEditing={searchByCity}
            returnKeyType="search"
          />
          {cityQuery.length > 0 && (
            <TouchableOpacity onPress={() => setCityQuery('')}>
              <Icon name="close-circle" size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchBtn} onPress={searchByCity}>
          <Text style={styles.searchBtnText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickBtn} onPress={loadNearbySuggestions}>
          <Icon name="locate" size={18} color={colors.primary} />
          <Text style={styles.quickBtnText}>Gần tôi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.quickBtn, styles.quickBtnMap]} onPress={handleOpenMap}>
          <Icon name="map" size={18} color={colors.white} />
          <Text style={[styles.quickBtnText, { color: colors.white }]}>Chọn trên bản đồ</Text>
        </TouchableOpacity>
      </View>

      {/* Status Message */}
      {statusMessage && (
        <View style={styles.statusBar}>
          <Icon name="information-circle" size={16} color={colors.textMedium} />
          <Text style={styles.statusText}>{statusMessage}</Text>
        </View>
      )}

      {/* Location List */}
      <View style={styles.listSection}>
        <Text style={styles.listTitle}>
          Địa điểm thân thiện với thú cưng ({locations.length})
        </Text>

        {locationsLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải danh sách...</Text>
          </View>
        ) : (
          <FlatList
            data={locations}
            keyExtractor={(item) => item.locationId.toString()}
            renderItem={renderLocationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={() => (
              <View style={styles.emptyBox}>
                <Icon name="location-outline" size={48} color={colors.border} />
                <Text style={styles.emptyTitle}>Chưa có địa điểm</Text>
                <Text style={styles.emptyText}>
                  Thử tìm theo thành phố khác hoặc chọn vị trí trên bản đồ
                </Text>
              </View>
            )}
          />
        )}
      </View>

      {/* Custom Alert */}
      {alertConfig && (
        <CustomAlert
          visible={visible}
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={hideAlert}
        />
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.whiteWarm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: colors.white,
    ...shadows.small,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.whiteWarm,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textDark,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  searchBtnText: {
    color: colors.white,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  quickBtnMap: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.warning + '15',
    borderRadius: radius.sm,
  },
  statusText: {
    flex: 1,
    fontSize: 13,
    color: colors.textMedium,
  },
  listSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
    marginBottom: 12,
  },
  listContent: {
    paddingBottom: 20,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadows.small,
  },
  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textDark,
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: colors.textMedium,
    lineHeight: 18,
  },
  locationTags: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.bgGradientStart,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  tagPetFriendly: {
    backgroundColor: colors.success + '15',
  },
  tagText: {
    fontSize: 11,
    color: colors.textMedium,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMedium,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textDark,
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMedium,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 20,
  },
});

export default LocationPickerScreen;
