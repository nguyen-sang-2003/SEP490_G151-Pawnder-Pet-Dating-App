/**
 * Location Picker Screen
 * Chọn địa điểm cho cuộc hẹn - Vị trí gần đây + Tự chọn trên bản đồ
 */

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useDispatch } from 'react-redux';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import { setSelectedLocation } from '../appointmentSlice';
import { LocationSelectionResult } from '../../../types/location.types';
import { CreateLocationRequest, LocationResponse } from '../../../types/appointment.types';
import { colors, gradients, radius, shadows } from '../../../theme';
import { AppointmentService } from '../../../services/appointment.service';

type Props = NativeStackScreenProps<RootStackParamList, 'LocationPicker'>;

const LocationPickerScreen = ({ navigation, route }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const [recentLocations, setRecentLocations] = useState<LocationResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentLocations();
  }, []);

  const loadRecentLocations = async () => {
    setLoading(true);
    try {
      const locations = await AppointmentService.getMyRecentLocations(10);
      
      // Deduplicate locations theo locationId (ưu tiên) hoặc name + address
      const uniqueLocations = locations.reduce((acc: LocationResponse[], current) => {
        const isDuplicate = acc.some(item => 
          item.locationId === current.locationId ||
          (item.name === current.name && item.address === current.address)
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        
        return acc;
      }, []);
      
      setRecentLocations(uniqueLocations);
    } catch (error) {
      console.log('Error loading recent locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRecentLocation = (location: LocationResponse) => {
    const customLocation: CreateLocationRequest = {
      name: location.name,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      district: location.district,
      placeType: location.placeType || 'custom',
    };

    const selection: LocationSelectionResult = {
      type: 'CUSTOM',
      customLocation,
      displayName: location.name || location.address,
    };

    dispatch(setSelectedLocation(selection));
    navigation.goBack();
  };

  const handleOpenMap = () => {
    // Navigate to MapPicker, khi confirm sẽ back 2 màn hình
    navigation.navigate('MapPicker', {
      city: route.params?.city,
      returnToCreate: true, // Flag để MapPicker biết cần back 2 lần
    });
  };

  const renderRecentItem = ({ item }: { item: LocationResponse }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => handleSelectRecentLocation(item)}
      activeOpacity={0.7}
    >
      <View style={styles.locationIcon}>
        <Icon name="time-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.locationInfo}>
        <Text style={styles.locationName} numberOfLines={1}>
          {item.name || 'Vị trí tùy chọn'}
        </Text>
        <Text style={styles.locationAddress} numberOfLines={2}>
          {item.address}
        </Text>
        {(item.city || item.district) && (
          <View style={styles.locationTags}>
            {item.district && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.district}</Text>
              </View>
            )}
            {item.city && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.city}</Text>
              </View>
            )}
          </View>
        )}
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

      {/* Main Action - Chọn trên bản đồ */}
      <View style={styles.mainAction}>
        <TouchableOpacity style={styles.mapBtn} onPress={handleOpenMap} activeOpacity={0.85}>
          <LinearGradient colors={gradients.chat} style={styles.mapBtnGradient}>
            <View style={styles.mapBtnIcon}>
              <Icon name="map" size={24} color={colors.white} />
            </View>
            <View style={styles.mapBtnContent}>
              <Text style={styles.mapBtnTitle}>Chọn vị trí trên bản đồ</Text>
              <Text style={styles.mapBtnSubtitle}>Tìm kiếm hoặc ghim vị trí bất kỳ</Text>
            </View>
            <Icon name="chevron-forward" size={22} color={colors.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Recent Locations */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.recentTitle}>
            <Icon name="time-outline" size={16} color={colors.textMedium} /> Vị trí gần đây
          </Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : recentLocations.length > 0 ? (
          <FlatList
            data={recentLocations}
            keyExtractor={(item) => item.locationId.toString()}
            renderItem={renderRecentItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyBox}>
            <Icon name="location-outline" size={48} color={colors.border} />
            <Text style={styles.emptyTitle}>Chưa có vị trí gần đây</Text>
            <Text style={styles.emptyText}>
              Các địa điểm từ cuộc hẹn trước sẽ hiển thị ở đây để chọn nhanh
            </Text>
          </View>
        )}
      </View>
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
  mainAction: {
    padding: 16,
  },
  mapBtn: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.medium,
  },
  mapBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  mapBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBtnContent: {
    flex: 1,
  },
  mapBtnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  mapBtnSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  recentSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMedium,
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
    backgroundColor: colors.bgGradientStart,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
