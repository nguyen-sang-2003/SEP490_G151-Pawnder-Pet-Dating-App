import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { PERMISSIONS, RESULTS, check, openSettings, request } from 'react-native-permissions';
import { Coordinates, LocationPermissionResult, ReverseGeocodeResult } from '../types/location.types';
import { getCityCenter } from '../config/maps.config';

const DEFAULT_LOCATION_TIMEOUT = 15000;
const DEFAULT_MAX_AGE = 10000;

const getLocationPermissionType = () => {
  if (Platform.OS === 'ios') {
    return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  }
  return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
};

/**
 * Request location permission from user
 * Android requires runtime permission, iOS uses Info.plist
 */
export const requestLocationPermission = async (): Promise<boolean> => {
  const result = await ensureLocationPermission();
  return result.granted;
};

/**
 * Request location permission with explicit status for better UX
 */
export const ensureLocationPermission = async (): Promise<LocationPermissionResult> => {
  const permissionType = getLocationPermissionType();

  try {
    const status = await check(permissionType);

    if (status === RESULTS.GRANTED) {
      return { granted: true };
    }

    if (status === RESULTS.BLOCKED) {
      return {
        granted: false,
        blocked: true,
        message: 'Quyền vị trí đang bị tắt. Mở Cài đặt để bật lại.',
      };
    }

    const requestResult = await request(permissionType);

    if (requestResult === RESULTS.GRANTED) {
      return { granted: true };
    }

    if (requestResult === RESULTS.BLOCKED) {
      return {
        granted: false,
        blocked: true,
        message: 'Quyền vị trí đang bị chặn trong Cài đặt.',
      };
    }

    return {
      granted: false,
      message: 'Bạn đã từ chối cấp quyền vị trí.',
    };
  } catch (error) {
    // Fallback for platforms or permission errors
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        return { granted: granted === PermissionsAndroid.RESULTS.GRANTED };
      } catch {
        return { granted: false, message: 'Không thể yêu cầu quyền vị trí.' };
      }
    }

    return { granted: false, message: 'Không thể yêu cầu quyền vị trí.' };
  }
};

/**
 * Get current GPS coordinates
 * Returns promise with { latitude, longitude }
 */
export const getCurrentLocation = (): Promise<Coordinates> => {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        let errorMessage = 'Không thể lấy vị trí. ';

        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage += 'Vui lòng cấp quyền truy cập vị trí trong cài đặt.';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage += 'Vị trí không khả dụng.';
            break;
          case 3: // TIMEOUT
            errorMessage += 'Hết thời gian chờ.';
            break;
          default:
            errorMessage += 'Vui lòng thử lại.';
        }

        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: DEFAULT_LOCATION_TIMEOUT,
        maximumAge: DEFAULT_MAX_AGE,
      }
    );
  });
};

/**
 * Request permission and get current location
 * Combined helper function
 */
export const requestLocationAndGetCoordinates = async (): Promise<Coordinates | null> => {
  try {
    // Step 1: Request permission
    const permission = await ensureLocationPermission();

    if (!permission.granted) {
      if (permission.blocked) {
        await openSettings().catch(() => null);
      }
      throw new Error(permission.message || 'Bạn cần cấp quyền vị trí để tiếp tục.');
    }

    // Step 2: Get coordinates
    const coordinates = await getCurrentLocation();
    return coordinates;
  } catch (error: any) {
    throw error;
  }
};

/**
 * Get current location but fall back to a city center if permission denied or GPS fails
 */
export const getSafeInitialCoordinate = async (
  city?: string
): Promise<{ coordinate: Coordinates; fromFallback: boolean; message?: string }> => {
  try {
    const permission = await ensureLocationPermission();
    if (!permission.granted) {
      return {
        coordinate: getCityCenter(city),
        fromFallback: true,
        message: permission.message,
      };
    }

    const coordinate = await getCurrentLocation();
    return { coordinate, fromFallback: false };
  } catch (error: any) {
    return {
      coordinate: getCityCenter(city),
      fromFallback: true,
      message: error?.message,
    };
  }
};

/**
 * Reverse geocode lat/lng to address
 * Uses OpenStreetMap Nominatim (free, no API key required)
 */
export const reverseGeocodeCoordinates = async (
  coords: Coordinates
): Promise<ReverseGeocodeResult> => {
  const fallbackAddress = `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=vi&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'PetApp/1.0',
      },
    });
    
    const data = await response.json();

    if (data && data.display_name) {
      const addr = data.address || {};
      
      // City: thử nhiều field phổ biến ở VN
      const city = addr.city 
        || addr.town 
        || addr.province 
        || addr.state 
        || addr.municipality
        || addr.county;
      
      // District: VN thường dùng city_district, suburb, quarter
      const district = addr.city_district
        || addr.district
        || addr.suburb
        || addr.quarter
        || addr.neighbourhood
        || addr.village
        || addr.hamlet;
      
      // Name: tên địa điểm cụ thể
      const name = addr.amenity 
        || addr.shop 
        || addr.building 
        || addr.tourism
        || addr.leisure
        || addr.office;
      
      return {
        address: data.display_name,
        name: name || undefined,
        city,
        district,
      };
    }

    return { address: fallbackAddress };
  } catch (error: any) {
    console.warn('Nominatim geocoding error:', error?.message || error);
    return { address: fallbackAddress };
  }
};
