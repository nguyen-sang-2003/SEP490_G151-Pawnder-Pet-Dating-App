/**
 * Map Picker Screen
 * Chọn vị trí trên bản đồ cho cuộc hẹn
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { LatLng, Marker, Region } from 'react-native-maps';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { RootStackParamList } from '../../../navigation/AppNavigator';
import { AppDispatch } from '../../../app/store';
import { setSelectedLocation } from '../appointmentSlice';
import { colors, gradients, radius, shadows } from '../../../theme';
import { CreateLocationRequest } from '../../../types/appointment.types';
import { LocationSelectionResult } from '../../../types/location.types';
import {
  getSafeInitialCoordinate,
  reverseGeocodeCoordinates,
} from '../../../services/location.service';
import CustomAlert from '../../../components/CustomAlert';
import { useCustomAlert } from '../../../hooks/useCustomAlert';

type Props = NativeStackScreenProps<RootStackParamList, 'MapPicker'>;

const DEFAULT_DELTA = {
  latitudeDelta: 0.012,
  longitudeDelta: 0.012,
};

interface SearchResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

const MapPickerScreen = ({ navigation, route }: Props) => {
  const dispatch = useDispatch<AppDispatch>();
  const mapRef = useRef<any>(null);
  const { alertConfig, visible, showAlert, hideAlert } = useCustomAlert();

  const [region, setRegion] = useState<Region | null>(null);
  const [markerCoord, setMarkerCoord] = useState<LatLng | null>(
    route.params?.initialCoordinate || null
  );
  const [address, setAddress] = useState(route.params?.initialAddress || '');
  const [name, setName] = useState(route.params?.initialName || '');
  const [city, setCity] = useState(route.params?.city || '');
  const [district, setDistrict] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | undefined>(undefined);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    loadInitialRegion();
  }, []);

  const loadInitialRegion = async () => {
    const { coordinate, fromFallback, message } = await getSafeInitialCoordinate(
      route.params?.city
    );

    const targetCoordinate = route.params?.initialCoordinate || coordinate;
    setRegion({
      ...targetCoordinate,
      ...DEFAULT_DELTA,
    });
    setMarkerCoord(targetCoordinate);

    if (fromFallback) {
      setInfoMessage(message || 'Đang dùng tọa độ trung tâm thành phố.');
    }

    if (!route.params?.initialAddress) {
      fetchAddress(targetCoordinate);
    }
  };

  const fetchAddress = async (coord: LatLng) => {
    setLoadingAddress(true);
    try {
      const geo = await reverseGeocodeCoordinates({
        latitude: coord.latitude,
        longitude: coord.longitude,
      });

      setAddress(geo.address);
      if (geo.city) setCity(geo.city);
      if (geo.district) setDistrict(geo.district);
      if (geo.name && !name) setName(geo.name);
    } catch (error) {
      setAddress(`${coord.latitude.toFixed(6)}, ${coord.longitude.toFixed(6)}`);
    } finally {
      setLoadingAddress(false);
    }
  };

  // Search địa điểm bằng Nominatim
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    Keyboard.dismiss();
    setSearching(true);
    setShowResults(true);

    try {
      // Thêm Vietnam vào query để kết quả chính xác hơn
      const query = searchQuery.trim();
      const searchText = query.toLowerCase().includes('vietnam') || query.toLowerCase().includes('việt nam')
        ? query
        : `${query}, Vietnam`;
      
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchText)}&limit=10&accept-language=vi&addressdetails=1&countrycodes=vn`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'PetApp/1.0' },
      });
      const data = await response.json();

      const results: SearchResult[] = data.map((item: any) => {
        // Lấy tên ngắn gọn từ address details
        const addr = item.address || {};
        let shortName = item.display_name.split(',')[0];
        
        // Ưu tiên hiển thị tên địa điểm cụ thể
        if (addr.amenity) shortName = addr.amenity;
        else if (addr.shop) shortName = addr.shop;
        else if (addr.tourism) shortName = addr.tourism;
        else if (addr.leisure) shortName = addr.leisure;
        
        return {
          placeId: String(item.place_id),
          name: shortName,
          address: item.display_name,
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        };
      });

      setSearchResults(results);
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (result: SearchResult) => {
    const coord = { latitude: result.lat, longitude: result.lon };
    setMarkerCoord(coord);
    setShowResults(false);
    setSearchQuery('');

    // Animate to location
    mapRef.current?.animateToRegion({
      ...coord,
      ...DEFAULT_DELTA,
    }, 500);

    fetchAddress(coord);
  };

  const handleMarkerUpdate = (coord: LatLng) => {
    setMarkerCoord(coord);
    fetchAddress(coord);
  };

  const handleLongPress = (event: { nativeEvent: { coordinate: LatLng } }) => {
    handleMarkerUpdate(event.nativeEvent.coordinate);
  };

  const handleDragEnd = (event: { nativeEvent: { coordinate: LatLng } }) => {
    handleMarkerUpdate(event.nativeEvent.coordinate);
  };

  // Zoom controls
  const handleZoom = (zoomIn: boolean) => {
    if (!region || !mapRef.current) return;

    const factor = zoomIn ? 0.5 : 2;
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };

    mapRef.current.animateToRegion(newRegion, 300);
    setRegion(newRegion);
  };

  // Go to current location
  const handleGoToMyLocation = async () => {
    try {
      const { coordinate, fromFallback } = await getSafeInitialCoordinate();
      if (!fromFallback && mapRef.current) {
        mapRef.current.animateToRegion({
          ...coordinate,
          ...DEFAULT_DELTA,
        }, 500);
        handleMarkerUpdate(coordinate);
      }
    } catch (error) {
      showAlert({
        type: 'warning',
        title: 'Không thể lấy vị trí',
        message: 'Vui lòng bật định vị để sử dụng tính năng này.',
      });
    }
  };

  const handleConfirm = () => {
    if (!markerCoord) {
      showAlert({
        type: 'warning',
        title: 'Chưa chọn vị trí',
        message: 'Nhấn và giữ trên bản đồ để đặt marker.',
      });
      return;
    }

    if (!address.trim()) {
      showAlert({
        type: 'warning',
        title: 'Thiếu địa chỉ',
        message: 'Vui lòng nhập địa chỉ hoặc đợi lấy lại từ bản đồ.',
      });
      return;
    }

    const customLocation: CreateLocationRequest = {
      name: name.trim() || 'Vị trí tùy chọn',
      address: address.trim(),
      latitude: markerCoord.latitude,
      longitude: markerCoord.longitude,
      city: city || undefined,
      district: district || undefined,
      placeType: 'custom',
    };

    const selection: LocationSelectionResult = {
      type: 'CUSTOM',
      customLocation,
      displayName: name.trim() || address.trim(),
    };

    dispatch(setSelectedLocation(selection));
    
    // Nếu được gọi từ LocationPicker với flag returnToCreate, back 2 lần
    if (route.params?.returnToCreate) {
      navigation.pop(2); // Back qua LocationPicker về CreateAppointment
    } else {
      navigation.goBack();
    }
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handleSelectSearchResult(item)}
    >
      <Icon name="location" size={18} color={colors.primary} />
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.searchResultAddress} numberOfLines={2}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderMap = () => {
    if (!region) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
        </View>
      );
    }

    return (
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          onLongPress={handleLongPress}
          showsUserLocation
        >
          {markerCoord && (
            <Marker
              coordinate={markerCoord}
              draggable
              onDragEnd={handleDragEnd}
            />
          )}
        </MapView>

        {/* Search Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBox}>
            <Icon name="search" size={18} color={colors.textLight} />
            <TextInput
              style={styles.searchInput}
              placeholder="Tìm địa điểm..."
              placeholderTextColor={colors.textLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setShowResults(false); }}>
                <Icon name="close-circle" size={18} color={colors.textLight} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleSearch} style={styles.searchBtn}>
              <Icon name="arrow-forward" size={18} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Search Results */}
          {showResults && (
            <View style={styles.searchResults}>
              {searching ? (
                <ActivityIndicator color={colors.primary} style={{ padding: 20 }} />
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  keyExtractor={(item) => item.placeId}
                  renderItem={renderSearchResult}
                  keyboardShouldPersistTaps="handled"
                  style={{ maxHeight: 250 }}
                />
              ) : (
                <View style={styles.noResultsBox}>
                  <Text style={styles.noResults}>Không tìm thấy kết quả</Text>
                  <Text style={styles.noResultsHint}>Thử: "Quận 1", "Cafe ABC", "Công viên XYZ"</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom(true)}>
            <Icon name="add" size={22} color={colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom(false)}>
            <Icon name="remove" size={22} color={colors.textDark} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, styles.locationBtn]} onPress={handleGoToMyLocation}>
            <Icon name="locate" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Hint */}
        <View style={styles.mapHint}>
          <Icon name="hand-left" size={16} color={colors.white} />
          <Text style={styles.mapHintText}>
            Nhấn giữ để đặt marker, có thể kéo để điều chỉnh.
          </Text>
        </View>

        {loadingAddress && (
          <View style={styles.addressLoading}>
            <ActivityIndicator color={colors.white} size="small" />
            <Text style={styles.addressLoadingText}>Đang lấy địa chỉ...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={gradients.chat} style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="close" size={22} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chọn trên bản đồ</Text>
        <View style={styles.backBtn} />
      </LinearGradient>

      {/* Map */}
      {renderMap()}

      {/* Form */}
      <View style={[styles.formCard, shadows.large]}>
        {infoMessage && (
          <View style={styles.infoRow}>
            <Icon name="information-circle" size={18} color={colors.warning} />
            <Text style={styles.infoText}>{infoMessage}</Text>
          </View>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tên địa điểm (không bắt buộc)</Text>
          <TextInput
            placeholder="Cafe pet friendly, công viên..."
            placeholderTextColor={colors.textLight}
            value={name}
            onChangeText={setName}
            style={styles.input}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa chỉ</Text>
          <TextInput
            placeholder="Số nhà, đường..."
            placeholderTextColor={colors.textLight}
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            multiline
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, styles.rowItem]}>
            <Text style={styles.label}>Thành phố</Text>
            <TextInput
              placeholder="Ví dụ: Hồ Chí Minh"
              placeholderTextColor={colors.textLight}
              value={city}
              onChangeText={setCity}
              style={styles.input}
            />
          </View>
          <View style={[styles.inputGroup, styles.rowItem]}>
            <Text style={styles.label}>Quận/Huyện</Text>
            <TextInput
              placeholder="Quận 1..."
              placeholderTextColor={colors.textLight}
              value={district}
              onChangeText={setDistrict}
              style={styles.input}
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleConfirm}
          activeOpacity={0.85}
        >
          <LinearGradient colors={gradients.chat} style={styles.confirmBtnGradient}>
            <Icon name="checkmark" size={18} color={colors.white} />
            <Text style={styles.confirmBtnText}>Xác nhận vị trí này</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 14,
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.white,
    fontWeight: '700',
    fontSize: 17,
  },
  mapWrapper: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  // Search
  searchContainer: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingLeft: 12,
    gap: 8,
    ...shadows.medium,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textDark,
  },
  searchBtn: {
    backgroundColor: colors.primary,
    padding: 12,
    borderTopRightRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  searchResults: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginTop: 8,
    maxHeight: 200,
    ...shadows.medium,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textDark,
  },
  searchResultAddress: {
    fontSize: 12,
    color: colors.textMedium,
    marginTop: 2,
  },
  noResults: {
    fontSize: 14,
    color: colors.textMedium,
    textAlign: 'center',
  },
  noResultsBox: {
    padding: 20,
    alignItems: 'center',
  },
  noResultsHint: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 4,
  },
  // Map Controls
  mapControls: {
    position: 'absolute',
    right: 12,
    top: 80,
    gap: 8,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.small,
  },
  locationBtn: {
    marginTop: 8,
  },
  mapHint: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  mapHintText: {
    flex: 1,
    color: colors.white,
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: colors.textMedium,
  },
  addressLoading: {
    position: 'absolute',
    top: 80,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addressLoadingText: {
    color: colors.white,
    fontSize: 12,
  },
  formCard: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    gap: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    backgroundColor: colors.warning + '15',
    borderRadius: radius.md,
  },
  infoText: {
    flex: 1,
    color: colors.textMedium,
    fontSize: 12,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    color: colors.textLight,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.whiteWarm,
    color: colors.textDark,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  rowItem: {
    flex: 1,
  },
  confirmBtn: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: 6,
  },
  confirmBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  confirmBtnText: {
    color: colors.white,
    fontWeight: '700',
  },
});

export default MapPickerScreen;
